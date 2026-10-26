# backend/app/services/tremor_service.py

import os
import json
import numpy as np
import cv2
import joblib
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions
from mediapipe.tasks.python.core import base_options as BaseOptions
import warnings
warnings.filterwarnings('ignore')

class TremorService:
    """Hand tremor analysis service with trained XGBoost model"""
    
    def __init__(self, db: Session = None):
        self.db = db
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.landmarker = None
        self.sample_rate = 30  # FPS
        self._load_model()
        self._init_mediapipe()
    
    def _load_model(self):
        """Load trained tremor model"""
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            models_dir = os.path.join(base_dir, 'models')
            
            model_path = os.path.join(models_dir, 'xgboost_tremor_model_clinical.pkl')
            
            if os.path.exists(model_path):
                model_data = joblib.load(model_path)
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.label_encoder = model_data['label_encoder']
                self.feature_importance = model_data.get('feature_importance', None)
                print("✅ Tremor model loaded successfully!")
            else:
                print(f"⚠️ Tremor model not found at {model_path}")
                self.model = None
                
        except Exception as e:
            print(f"⚠️ Error loading tremor model: {e}")
            self.model = None
    
    def _init_mediapipe(self):
        """Initialize MediaPipe Hand Landmarker"""
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, 'models', 'hand_landmarker.task')
            
            if not os.path.exists(model_path):
                print("⚠️ hand_landmarker.task not found!")
                print("📌 Download from: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task")
                return
            
            base_options = BaseOptions.BaseOptions(
                model_asset_path=model_path
            )
            options = HandLandmarkerOptions(
                base_options=base_options,
                num_hands=1,
                min_hand_detection_confidence=0.5,
                min_hand_presence_confidence=0.3,
                min_tracking_confidence=0.3
            )
            self.landmarker = HandLandmarker.create_from_options(options)
            print("✅ MediaPipe Hand Landmarker initialized!")
            
        except Exception as e:
            print(f"⚠️ MediaPipe initialization failed: {e}")
            self.landmarker = None
    
    def extract_landmarks_from_video(self, video_path: str) -> list:
        """Extract hand landmarks from video file - FIXED for WebM"""
        landmarks_list = []
        
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                print(f"❌ Cannot open video: {video_path}")
                return []
            
            # ===== FIX: Handle WebM video properly =====
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0 or fps > 100:
                fps = 30  # Default FPS for WebM
            
            # ===== FIX: Get total frames safely =====
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # If total_frames is negative or huge (WebM issue), estimate from duration
            if total_frames <= 0 or total_frames > 10000:
                duration = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
                if duration <= 0:
                    duration = 10  # Default 10 seconds
                total_frames = int(fps * duration)
            
            print(f"📊 Video: {video_path}")
            print(f"📊 FPS: {fps:.1f}")
            print(f"📊 Total frames: {total_frames}")
            
            # Process up to 10 seconds or 300 frames
            max_frames = min(total_frames, int(fps * 10), 300)
            print(f"📊 Processing: {max_frames} frames")
            
            frame_count = 0
            success_count = 0
            
            while cap.isOpened() and frame_count < max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every frame
                landmarks = self.extract_landmarks_from_frame(frame)
                if landmarks:
                    landmarks_list.append(landmarks)
                    success_count += 1
                
                frame_count += 1
                
                # Progress update every 30 frames
                if frame_count % 30 == 0:
                    print(f"   Processed {frame_count} frames, detected {success_count} hands")
            
            cap.release()
            
            print(f"✅ Extracted {len(landmarks_list)} frames from video")
            if frame_count > 0:
                print(f"   Success rate: {success_count}/{frame_count} ({success_count/frame_count*100:.1f}%)")
            
        except Exception as e:
            print(f"❌ Error processing video: {e}")
            import traceback
            traceback.print_exc()
        
        return landmarks_list
    
    def extract_landmarks_from_frame(self, frame: np.ndarray) -> list:
        """Extract hand landmarks from a single frame"""
        if self.landmarker is None:
            return None
        
        try:
            # Resize for faster processing
            height, width = frame.shape[:2]
            if width > 640:
                scale = 640 / width
                new_width = 640
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height))
            
            # Enhance contrast
            try:
                lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                cl = clahe.apply(l)
                enhanced = cv2.merge((cl, a, b))
                frame = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
            except:
                pass
            
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            
            detection_result = self.landmarker.detect(mp_image)
            
            if not detection_result or not detection_result.hand_landmarks:
                return None
            
            landmarks = []
            for hand_landmarks in detection_result.hand_landmarks:
                for landmark in hand_landmarks:
                    landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z if hasattr(landmark, 'z') else 0.0
                    })
            return landmarks
            
        except Exception as e:
            return None
    
    def extract_features_from_landmarks(self, landmarks_list: list) -> Dict[str, float]:
        """Extract clinical features from landmarks"""
        if not landmarks_list or len(landmarks_list) < 5:
            print(f"⚠️ Not enough frames: {len(landmarks_list) if landmarks_list else 0}")
            return None
        
        try:
            frames = len(landmarks_list)
            num_landmarks = len(landmarks_list[0])
            
            # Create time series
            landmark_series = np.zeros((frames, num_landmarks, 2))
            for i, frame_landmarks in enumerate(landmarks_list):
                for j, lm in enumerate(frame_landmarks):
                    landmark_series[i, j, 0] = lm['x']
                    landmark_series[i, j, 1] = lm['y']
            
            # Use wrist and fingertips
            wrist_idx = 0
            index_tip_idx = 8
            middle_tip_idx = 12
            
            wrist_x = landmark_series[:, wrist_idx, 0]
            wrist_y = landmark_series[:, wrist_idx, 1]
            index_x = landmark_series[:, index_tip_idx, 0]
            index_y = landmark_series[:, index_tip_idx, 1]
            middle_x = landmark_series[:, middle_tip_idx, 0]
            middle_y = landmark_series[:, middle_tip_idx, 1]
            
            hand_center_x = (index_x + middle_x) / 2
            hand_center_y = (index_y + middle_y) / 2
            
            # 1. Tremor Frequency
            try:
                signal = hand_center_x - np.mean(hand_center_x)
                if len(signal) > 4:
                    fft = np.fft.fft(signal)
                    freqs = np.fft.fftfreq(len(signal), 1/self.sample_rate)
                    magnitude = np.abs(fft)
                    valid_indices = np.where((freqs >= 2) & (freqs <= 15))[0]
                    if len(valid_indices) > 0:
                        dominant_idx = valid_indices[np.argmax(magnitude[valid_indices])]
                        tremor_frequency = abs(freqs[dominant_idx])
                    else:
                        tremor_frequency = 0.0
                else:
                    tremor_frequency = 0.0
            except:
                tremor_frequency = 0.0
            
            # 2. Tremor Amplitude
            try:
                displacement = np.sqrt(np.diff(hand_center_x)**2 + np.diff(hand_center_y)**2)
                if len(displacement) > 0:
                    tremor_amplitude = np.mean(displacement) * 100
                else:
                    tremor_amplitude = 0.0
            except:
                tremor_amplitude = 0.0
            
            # 3. Hand Stability
            try:
                hand_stability = 100 - (np.std(hand_center_x) + np.std(hand_center_y)) * 200
                hand_stability = max(0, min(100, hand_stability))
            except:
                hand_stability = 50.0
            
            # 4. Jerk
            try:
                if len(hand_center_x) > 3:
                    jerk = np.mean(np.abs(np.diff(np.diff(np.diff(hand_center_x))))) * 1000
                else:
                    jerk = 0.0
            except:
                jerk = 0.0
            
            # 5. Variance
            try:
                variance = np.var(hand_center_x) + np.var(hand_center_y)
            except:
                variance = 0.0
            
            # 6. Range of Movement
            try:
                range_movement = (np.max(hand_center_x) - np.min(hand_center_x) + 
                                 np.max(hand_center_y) - np.min(hand_center_y)) * 100
            except:
                range_movement = 0.0
            
            # 7. Wrist Stability
            try:
                wrist_stability = 100 - np.std(wrist_x) * 100
                wrist_stability = max(0, min(100, wrist_stability))
            except:
                wrist_stability = 50.0
            
            # 8. Wrist Movement
            try:
                wrist_movement = (np.max(wrist_x) - np.min(wrist_x) + 
                                 np.max(wrist_y) - np.min(wrist_y)) * 100
            except:
                wrist_movement = 0.0
            
            features = {
                'tremor_frequency': tremor_frequency,
                'tremor_amplitude': tremor_amplitude,
                'hand_stability': hand_stability,
                'jerk': jerk,
                'variance': variance,
                'range_movement': range_movement,
                'wrist_stability': wrist_stability,
                'wrist_movement': wrist_movement
            }
            
            return features
            
        except Exception as e:
            print(f"Error extracting features: {e}")
            return None
    
    def predict_tremor(self, features: Dict[str, float]) -> Tuple[str, float, float]:
        """Predict tremor severity using trained model"""
        try:
            if self.model is None:
                return self._heuristic_score(features)
            
            feature_names = [
                'tremor_frequency', 'tremor_amplitude', 'hand_stability',
                'jerk', 'variance', 'range_movement',
                'wrist_stability', 'wrist_movement'
            ]
            
            feature_vector = []
            for name in feature_names:
                feature_vector.append(features.get(name, 0.0))
            
            X = np.array(feature_vector).reshape(1, -1)
            
            if self.scaler:
                X_scaled = self.scaler.transform(X)
            else:
                X_scaled = X
            
            prediction = self.model.predict(X_scaled)[0]
            
            if hasattr(self.model, 'predict_proba'):
                proba = self.model.predict_proba(X_scaled)[0]
                confidence = max(proba) * 100
            else:
                confidence = 85.0
            
            if self.label_encoder:
                label = self.label_encoder.inverse_transform([prediction])[0]
            else:
                labels = ['Normal', 'Mild', 'Severe']
                label = labels[prediction] if prediction < len(labels) else 'Unknown'
            
            if label == 'Normal':
                score = 85 + np.random.uniform(0, 15)
            elif label == 'Mild':
                score = 55 + np.random.uniform(0, 20)
            else:
                score = 20 + np.random.uniform(0, 25)
            
            score = max(0, min(100, score))
            confidence = max(50, min(100, confidence))
            
            return label, score, confidence
            
        except Exception as e:
            print(f"Error predicting tremor: {e}")
            return self._heuristic_score(features)
    
    def _heuristic_score(self, features: Dict[str, float]) -> Tuple[str, float, float]:
        """Fallback heuristic scoring"""
        tremor_freq = features.get('tremor_frequency', 0)
        amplitude = features.get('tremor_amplitude', 0)
        stability = features.get('hand_stability', 50)
        
        if tremor_freq < 3 and amplitude < 2 and stability > 80:
            label = 'Normal'
            score = 85 + np.random.uniform(0, 15)
        elif tremor_freq < 6 and amplitude < 5 and stability > 60:
            label = 'Mild'
            score = 55 + np.random.uniform(0, 20)
        else:
            label = 'Severe'
            score = 20 + np.random.uniform(0, 25)
        
        return label, max(0, min(100, score)), 80.0
    
    def analyze_video(self, video_path: str) -> Dict[str, Any]:
        """Complete tremor analysis from video"""
        try:
            landmarks = self.extract_landmarks_from_video(video_path)
            
            if not landmarks:
                return {
                    "error": "No hand landmarks detected in video",
                    "label": "Unknown",
                    "score": 50.0,
                    "confidence": 50.0
                }
            
            features = self.extract_features_from_landmarks(landmarks)
            
            if not features:
                return {
                    "error": "Failed to extract features",
                    "label": "Unknown",
                    "score": 50.0,
                    "confidence": 50.0
                }
            
            label, score, confidence = self.predict_tremor(features)
            
            return {
                "label": label,
                "score": score,
                "confidence": confidence,
                "features": features,
                "landmarks_count": len(landmarks)
            }
            
        except Exception as e:
            print(f"Error analyzing video: {e}")
            return {
                "error": str(e),
                "label": "Unknown",
                "score": 50.0,
                "confidence": 50.0
            }
    
    def create_assessment(self, user_id: int, video_path: str) -> Dict[str, Any]:
        """Create tremor assessment and store in database"""
        result = self.analyze_video(video_path)
        
        if self.db and not result.get('error'):
            from app.models.tremor import TremorAssessment
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
            
            features = result.get('features', {})
            
            assessment = TremorAssessment(
                user_id=user_id,
                twin_id=twin.id,
                video_path=video_path,
                tremor_frequency=features.get('tremor_frequency', 0),
                tremor_amplitude=features.get('tremor_amplitude', 0),
                hand_stability=features.get('hand_stability', 0),
                jerk=features.get('jerk', 0),
                variance=features.get('variance', 0),
                range_movement=features.get('range_movement', 0),
                wrist_stability=features.get('wrist_stability', 0),
                wrist_movement=features.get('wrist_movement', 0),
                score=result.get('score', 0),
                accuracy=result.get('confidence', 0),
                label=result.get('label', 'Unknown'),
                status='completed',
                completed_at=datetime.utcnow()
            )
            
            self.db.add(assessment)
            self.db.commit()
            self.db.refresh(assessment)
            
            result['assessment_id'] = assessment.id
        
        return result