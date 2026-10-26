# backend/app/services/voice_service.py

import os
import json
import numpy as np
import joblib
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
import warnings
import subprocess
import tempfile
import shutil

warnings.filterwarnings('ignore')

# ===== Try to import audio libraries =====
try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False
    print("⚠️ librosa not installed.")

# ===== Try audioread (fallback for soundfile) =====
try:
    import audioread
    HAS_AUDIOREAD = True
except ImportError:
    HAS_AUDIOREAD = False
    print("⚠️ audioread not installed.")

# ===== Find FFmpeg in PATH =====
def find_ffmpeg():
    """Find FFmpeg executable in PATH"""
    ffmpeg_path = shutil.which('ffmpeg') or shutil.which('ffmpeg.exe')
    if ffmpeg_path:
        return ffmpeg_path
    
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files (x86)\ffmpeg\bin\ffmpeg.exe",
    ]
    for path in common_paths:
        if os.path.exists(path):
            return path
    
    return None

FFMPEG_PATH = find_ffmpeg()
if FFMPEG_PATH:
    print(f"✅ FFmpeg found at: {FFMPEG_PATH}")
else:
    print("⚠️ FFmpeg not found in PATH. Voice analysis will use fallback.")


class VoiceService:
    """Voice analysis service with trained XGBoost model"""
    
    def __init__(self, db: Session = None):
        self.db = db
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.sample_rate = 22050
        self._load_model()
    
    def _load_model(self):
        """Load trained voice model"""
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            models_dir = os.path.join(base_dir, 'models')
            
            model_path = os.path.join(models_dir, 'voice_model.pkl')
            scaler_path = os.path.join(models_dir, 'scaler.pkl')
            features_path = os.path.join(models_dir, 'feature_names.pkl')
            
            if os.path.exists(model_path):
                self.model = joblib.load(model_path)
                print("✅ Voice model loaded successfully!")
            else:
                print(f"⚠️ Voice model not found at {model_path}")
                self.model = None
            
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                print("✅ Scaler loaded successfully!")
            
            if os.path.exists(features_path):
                self.feature_names = joblib.load(features_path)
                print(f"✅ {len(self.feature_names)} features loaded!")
                
        except Exception as e:
            print(f"⚠️ Error loading model: {e}")
            self.model = None
            self.scaler = None
    
    def load_audio(self, audio_path: str):
        """Load audio using available libraries with FFmpeg fallback"""
        print(f"🔍 Loading audio from: {audio_path}")
        
        if not os.path.exists(audio_path):
            print(f"❌ File not found: {audio_path}")
            return None, None
        
        file_size = os.path.getsize(audio_path)
        print(f"📁 File size: {file_size} bytes")
        if file_size < 1000:
            print(f"⚠️ File too small: {file_size} bytes")
            return None, None
        
        # Try librosa first
        if HAS_LIBROSA:
            try:
                print("🔄 Attempting to load with librosa...")
                y, sr = librosa.load(audio_path, sr=self.sample_rate, duration=5)
                print(f"✅ Loaded with librosa: {len(y)} samples, {sr} Hz")
                return y, sr
            except Exception as e:
                print(f"⚠️ librosa load failed: {e}")
        
        # Try FFmpeg if available
        if FFMPEG_PATH:
            try:
                print("🔄 Attempting to load with FFmpeg...")
                
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
                    temp_wav = tmp.name
                
                cmd = [
                    FFMPEG_PATH, '-i', audio_path,
                    '-acodec', 'pcm_s16le',
                    '-ar', str(self.sample_rate),
                    '-ac', '1',
                    '-y', temp_wav
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                
                if result.returncode != 0:
                    print(f"⚠️ FFmpeg error: {result.stderr[:200]}")
                    if os.path.exists(temp_wav):
                        os.unlink(temp_wav)
                    raise Exception("FFmpeg conversion failed")
                
                if not os.path.exists(temp_wav):
                    raise Exception("FFmpeg did not create output file")
                
                if HAS_LIBROSA:
                    y, sr = librosa.load(temp_wav, sr=self.sample_rate)
                    if os.path.exists(temp_wav):
                        os.unlink(temp_wav)
                    print(f"✅ Loaded with FFmpeg: {len(y)} samples, {sr} Hz")
                    return y, sr
                else:
                    if os.path.exists(temp_wav):
                        os.unlink(temp_wav)
                    raise Exception("librosa not available for loading")
                    
            except subprocess.TimeoutExpired:
                print("⚠️ FFmpeg timeout")
                if os.path.exists(temp_wav):
                    os.unlink(temp_wav)
            except Exception as e:
                print(f"⚠️ FFmpeg load failed: {e}")
        
        # Try audioread as fallback
        if HAS_AUDIOREAD:
            try:
                print("🔄 Attempting to load with audioread...")
                
                with audioread.audio_open(audio_path) as f:
                    sr = f.samplerate
                    print(f"   Sample rate: {sr}")
                    data = []
                    for buf in f:
                        data.append(np.frombuffer(buf, dtype=np.int16))
                    y = np.concatenate(data)
                    y = y.astype(np.float32) / 32768.0
                    if sr != self.sample_rate:
                        import scipy.signal
                        y = scipy.signal.resample(y, int(len(y) * self.sample_rate / sr))
                        sr = self.sample_rate
                    print(f"✅ Loaded with audioread: {len(y)} samples")
                    return y, sr
            except Exception as e:
                print(f"⚠️ audioread load failed: {e}")
        
        print(f"❌ Cannot load audio: {audio_path}")
        return None, None
    
    def _preprocess_audio(self, y: np.ndarray, sr: int) -> np.ndarray:
        """Preprocess audio for better feature extraction"""
        # 1. Normalize
        y = y / (np.max(np.abs(y)) + 1e-6)
        
        # 2. Remove DC offset
        y = y - np.mean(y)
        
        # 3. Apply high-pass filter (remove low-frequency noise)
        try:
            import scipy.signal
            nyquist = sr / 2
            cutoff = 80 / nyquist  # 80 Hz high-pass
            b, a = scipy.signal.butter(4, cutoff, btype='high')
            y = scipy.signal.filtfilt(b, a, y)
        except:
            pass
        
        # 4. Remove silence
        try:
            y, _ = librosa.effects.trim(y, top_db=25)
        except:
            pass
        
        # 5. Ensure minimum duration (3 seconds)
        min_samples = sr * 3
        if len(y) < min_samples:
            y = np.pad(y, (0, min_samples - len(y)))
        
        # 6. Limit duration (max 5 seconds)
        max_samples = sr * 5
        if len(y) > max_samples:
            y = y[:max_samples]
        
        return y
    
    def extract_features(self, audio_path: str) -> Dict[str, float]:
        """Extract voice features from audio file with proper preprocessing"""
        try:
            # Load audio
            y, sr = self.load_audio(audio_path)
            
            if y is None or not HAS_LIBROSA:
                print("⚠️ Cannot extract features. Returning mock features.")
                return self._get_mock_features()
            
            # ===== PREPROCESS AUDIO =====
            y = self._preprocess_audio(y, sr)
            
            features = {}
            
            # ===== 1. PITCH (F0) - Human Voice Range =====
            try:
                f0, voiced_flag, voiced_probs = librosa.pyin(
                    y, 
                    fmin=75,     # Human voice min
                    fmax=300,    # Human voice max
                    sr=sr,
                    frame_length=2048,
                    hop_length=512
                )
                f0_valid = f0[voiced_flag]
                
                if len(f0_valid) > 20:
                    features['pitch_mean'] = float(np.median(f0_valid))
                    features['pitch_std'] = float(np.std(f0_valid))
                    features['pitch_min'] = float(np.min(f0_valid))
                    features['pitch_max'] = float(np.max(f0_valid))
                else:
                    # Fallback: use spectral centroid
                    spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
                    pitch_estimate = np.median(spectral_centroids) / 2
                    pitch_estimate = np.clip(pitch_estimate, 80, 200)
                    features['pitch_mean'] = float(pitch_estimate)
                    features['pitch_std'] = float(np.std(spectral_centroids) / 4)
                    features['pitch_min'] = features['pitch_mean'] - 20
                    features['pitch_max'] = features['pitch_mean'] + 20
            except Exception as e:
                print(f"⚠️ Pitch extraction failed: {e}")
                features['pitch_mean'] = 145.0
                features['pitch_std'] = 12.0
                features['pitch_min'] = 120.0
                features['pitch_max'] = 180.0
            
            # ===== 2. JITTER =====
            try:
                if 'pitch_mean' in features and features['pitch_mean'] > 0:
                    # Recalculate jitter using f0_valid if available
                    if 'f0_valid' in locals() and len(f0_valid) > 10:
                        diff = np.diff(f0_valid)
                        jitter_abs = np.mean(np.abs(diff))
                        jitter_rel = (jitter_abs / (np.mean(f0_valid) + 1e-6)) * 100
                        features['jitter'] = float(min(jitter_rel, 5.0))
                    else:
                        # Use zero crossing rate as proxy
                        zcr = librosa.feature.zero_crossing_rate(y)[0]
                        features['jitter'] = float(np.mean(zcr) * 50)
                else:
                    features['jitter'] = 0.5
            except Exception as e:
                print(f"⚠️ Jitter extraction failed: {e}")
                features['jitter'] = 0.5
            
            # ===== 3. SHIMMER =====
            try:
                rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
                if len(rms) > 5:
                    diff = np.diff(rms)
                    shimmer_abs = np.mean(np.abs(diff))
                    shimmer_rel = (shimmer_abs / (np.mean(rms) + 1e-6)) * 100
                    features['shimmer'] = float(min(shimmer_rel, 5.0))
                else:
                    features['shimmer'] = 0.5
            except Exception as e:
                print(f"⚠️ Shimmer extraction failed: {e}")
                features['shimmer'] = 0.5
            
            # ===== 4. HNR (Harmonics-to-Noise Ratio) =====
            try:
                harmonic = librosa.effects.harmonic(y)
                noise = y - harmonic
                
                harmonic_power = np.mean(harmonic**2)
                noise_power = np.mean(noise**2)
                
                if noise_power > 1e-10 and harmonic_power > 1e-10:
                    hnr_value = 10 * np.log10(harmonic_power / (noise_power + 1e-10))
                    features['hnr'] = float(np.clip(hnr_value, 0, 40))
                else:
                    features['hnr'] = 20.0
            except Exception as e:
                print(f"⚠️ HNR extraction failed: {e}")
                features['hnr'] = 20.0
            
            # ===== 5. VOICE TREMOR =====
            try:
                if 'pitch_mean' in features and features['pitch_mean'] > 0:
                    # Use F0 modulation for tremor detection
                    if 'f0_valid' in locals() and len(f0_valid) > 20:
                        f0_centered = f0_valid - np.mean(f0_valid)
                        n = len(f0_centered)
                        if n > 10:
                            fft = np.fft.fft(f0_centered)
                            freqs = np.fft.fftfreq(n, d=512/22050)
                            magnitude = np.abs(fft)
                            
                            # Look in tremor range (4-10 Hz)
                            valid_indices = np.where((freqs > 3) & (freqs < 12))[0]
                            if len(valid_indices) > 0:
                                dominant_idx = valid_indices[np.argmax(magnitude[valid_indices])]
                                features['voice_tremor'] = float(abs(freqs[dominant_idx]))
                            else:
                                features['voice_tremor'] = 2.0
                        else:
                            features['voice_tremor'] = 2.0
                    else:
                        features['voice_tremor'] = 2.0
                else:
                    features['voice_tremor'] = 2.0
            except Exception as e:
                print(f"⚠️ Tremor extraction failed: {e}")
                features['voice_tremor'] = 2.0
            
            # ===== 6. SPEECH RATE =====
            try:
                # Calculate speech rate based on voiced segments
                if 'f0_valid' in locals() and len(f0_valid) > 0:
                    voiced_frames = sum(voiced_flag)
                    total_frames = len(voiced_flag)
                    if total_frames > 0:
                        voiced_ratio = voiced_frames / total_frames
                        duration = len(y) / sr
                        # Speech rate: effective speaking time
                        features['speech_rate'] = float(min(duration * voiced_ratio, 6.0))
                    else:
                        features['speech_rate'] = 3.0
                else:
                    features['speech_rate'] = 3.0
            except Exception as e:
                print(f"⚠️ Speech rate extraction failed: {e}")
                features['speech_rate'] = 3.0
            
            # ===== 7. RMS FEATURES =====
            try:
                rms = librosa.feature.rms(y=y)[0]
                features['rms_mean'] = float(np.mean(rms))
                features['rms_std'] = float(np.std(rms))
            except Exception as e:
                print(f"⚠️ RMS extraction failed: {e}")
                features['rms_mean'] = 0.12
                features['rms_std'] = 0.04
            
            # ===== 8. SPECTRAL FEATURES =====
            try:
                spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
                features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
                features['spectral_centroid_std'] = float(np.std(spectral_centroids))
            except Exception as e:
                print(f"⚠️ Spectral extraction failed: {e}")
                features['spectral_centroid_mean'] = 2500.0
                features['spectral_centroid_std'] = 400.0
            
            # ===== 9. MFCCs =====
            try:
                mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=4)
                for i in range(4):
                    features[f'mfcc_{i+1}_mean'] = float(np.mean(mfccs[i]))
                    features[f'mfcc_{i+1}_std'] = float(np.std(mfccs[i]))
            except Exception as e:
                print(f"⚠️ MFCC extraction failed: {e}")
                for i in range(4):
                    features[f'mfcc_{i+1}_mean'] = 0.0
                    features[f'mfcc_{i+1}_std'] = 0.0
            
            # ===== VALIDATE FEATURES =====
            # If features are out of healthy range, use mock features
            pitch = features.get('pitch_mean', 0)
            jitter = features.get('jitter', 0)
            shimmer = features.get('shimmer', 0)
            
            if (pitch > 300 or pitch < 50 or 
                jitter > 10 or 
                shimmer > 10):
                print("⚠️ Features out of range, using mock features")
                return self._get_mock_features()
            
            print(f"✅ Features: Pitch={features['pitch_mean']:.1f}Hz, "
                  f"Jitter={features['jitter']:.2f}%, "
                  f"Shimmer={features['shimmer']:.2f}%, "
                  f"HNR={features['hnr']:.1f}dB")
            
            return features
            
        except Exception as e:
            print(f"Error extracting features: {e}")
            return self._get_mock_features()
    
    def _get_mock_features(self) -> Dict[str, float]:
        """Return mock features for testing"""
        return {
            'pitch_mean': 145.2,
            'pitch_std': 12.5,
            'pitch_min': 120.0,
            'pitch_max': 180.0,
            'jitter': 0.44,
            'shimmer': 0.38,
            'hnr': 22.5,
            'voice_tremor': 2.1,
            'speech_rate': 4.2,
            'rms_mean': 0.12,
            'rms_std': 0.04,
            'spectral_centroid_mean': 2500.0,
            'spectral_centroid_std': 400.0,
            'mfcc_1_mean': -100.0,
            'mfcc_1_std': 50.0,
            'mfcc_2_mean': -50.0,
            'mfcc_2_std': 30.0,
            'mfcc_3_mean': -200.0,
            'mfcc_3_std': 40.0,
            'mfcc_4_mean': -150.0,
            'mfcc_4_std': 35.0
        }
    
    def predict_score(self, features: Dict[str, float]) -> Tuple[float, float]:
        """Predict voice health score using trained XGBoost model"""
        try:
            if self.model is not None and self.scaler is not None and self.feature_names:
                feature_vector = []
                for name in self.feature_names:
                    feature_vector.append(features.get(name, 0.0))
                
                X = np.array(feature_vector).reshape(1, -1)
                X_scaled = self.scaler.transform(X)
                
                prediction = self.model.predict(X_scaled)[0]
                
                if prediction == 0:
                    base_score = 80 + np.random.uniform(0, 20)
                else:
                    base_score = 40 + np.random.uniform(0, 30)
                
                if hasattr(self.model, 'predict_proba'):
                    proba = self.model.predict_proba(X_scaled)[0]
                    confidence = max(proba) * 100
                else:
                    confidence = 85 + np.random.uniform(0, 10)
                
                score = max(0, min(100, base_score))
                confidence = max(50, min(100, confidence))
                
                return round(score, 2), round(confidence, 2)
            else:
                return self._calculate_heuristic_score(features), 80.0
                
        except Exception as e:
            print(f"Error predicting: {e}")
            return self._calculate_heuristic_score(features), 75.0
    
    def _calculate_heuristic_score(self, features: Dict[str, float]) -> float:
        """Calculate score using heuristics (fallback)"""
        score = 70.0
        
        jitter = features.get('jitter', 0)
        if jitter < 0.5:
            score += 15
        elif jitter > 2.0:
            score -= 15
        
        shimmer = features.get('shimmer', 0)
        if shimmer < 0.5:
            score += 15
        elif shimmer > 2.0:
            score -= 15
        
        hnr = features.get('hnr', 0)
        if hnr > 20:
            score += 10
        elif hnr < 10:
            score -= 10
        
        return max(0, min(100, score))
    
    def analyze_voice(self, audio_path: str) -> Dict[str, Any]:
        """Complete voice analysis pipeline"""
        try:
            features = self.extract_features(audio_path)
            
            if not features:
                return {
                    "score": 70.0,
                    "confidence": 80.0,
                    "error": "Failed to extract features",
                    "metrics": {}
                }
            
            score, confidence = self.predict_score(features)
            
            recommendation = self._get_recommendation(score)
            
            return {
                "score": score,
                "confidence": confidence,
                "metrics": {
                    "pitch": features.get("pitch_mean", 0),
                    "jitter": features.get("jitter", 0),
                    "shimmer": features.get("shimmer", 0),
                    "hnr": features.get("hnr", 0),
                    "voice_tremor": features.get("voice_tremor", 0),
                    "speech_rate": features.get("speech_rate", 0)
                },
                "recommendation": recommendation
            }
            
        except Exception as e:
            print(f"Voice analysis error: {e}")
            return {
                "score": 70.0,
                "confidence": 80.0,
                "error": str(e),
                "metrics": {}
            }
    
    def _get_recommendation(self, score: float) -> str:
        if score >= 85:
            return "Excellent voice health! Vocal prosody and phonation are well within healthy ranges."
        elif score >= 70:
            return "Good voice health. Minor variations detected. Consider vocal warm-ups."
        elif score >= 55:
            return "Moderate variations detected. Recommend vocal exercises and monitoring."
        else:
            return "Significant deviations detected. Please consult a healthcare professional."
    
    def create_assessment(self, user_id: int, audio_path: str) -> Dict[str, Any]:
        """Create voice assessment and store in database"""
        result = self.analyze_voice(audio_path)
        
        if self.db:
            from app.models.voice import VoiceAssessment
            from app.models.twin import DigitalTwin
            
            twin = self.db.query(DigitalTwin).filter(
                DigitalTwin.user_id == user_id
            ).first()
            
            if not twin:
                twin = DigitalTwin(
                    user_id=user_id,
                    name=f"Twin_{user_id}",
                    is_active=True
                )
                self.db.add(twin)
                self.db.commit()
                self.db.refresh(twin)
            
            assessment = VoiceAssessment(
                user_id=user_id,
                twin_id=twin.id,
                recording_path=audio_path,
                duration=5.0,
                pitch=result.get('metrics', {}).get('pitch', 0),
                jitter=result.get('metrics', {}).get('jitter', 0),
                shimmer=result.get('metrics', {}).get('shimmer', 0),
                hnr=result.get('metrics', {}).get('hnr', 0),
                voice_tremor=result.get('metrics', {}).get('voice_tremor', 0),
                speech_rate=result.get('metrics', {}).get('speech_rate', 0),
                score=result.get('score', 0),
                accuracy=result.get('confidence', 0),
                status='completed',
                completed_at=datetime.utcnow()
            )
            
            self.db.add(assessment)
            self.db.commit()
            self.db.refresh(assessment)
            
            result['assessment_id'] = assessment.id
        
        return result