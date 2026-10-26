# backend/test_recording.py

import librosa
import numpy as np
import os
import subprocess
import tempfile
import shutil
import warnings
warnings.filterwarnings('ignore')

def find_ffmpeg():
    """Find FFmpeg executable"""
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
    print("⚠️ FFmpeg not found! Install from: https://ffmpeg.org/")

def find_latest_recording():
    """Find the latest voice recording"""
    audio_dir = 'uploads/voice'
    if not os.path.exists(audio_dir):
        print(f"❌ Directory not found: {audio_dir}")
        return None
    
    files = [f for f in os.listdir(audio_dir) if f.endswith(('.wav', '.mp3', '.m4a', '.webm', '.ogg'))]
    if not files:
        print(f"❌ No audio files found in {audio_dir}")
        return None
    
    # Sort by modification time (latest first)
    files.sort(key=lambda x: os.path.getmtime(os.path.join(audio_dir, x)), reverse=True)
    return os.path.join(audio_dir, files[0])

def convert_with_ffmpeg(audio_path):
    """Convert audio to WAV using FFmpeg"""
    if not FFMPEG_PATH:
        return None
    
    try:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            temp_wav = tmp.name
        
        cmd = [
            FFMPEG_PATH, '-i', audio_path,
            '-acodec', 'pcm_s16le',
            '-ar', '22050',
            '-ac', '1',
            '-y', temp_wav
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            print(f"⚠️ FFmpeg conversion failed: {result.stderr[:200]}")
            if os.path.exists(temp_wav):
                os.unlink(temp_wav)
            return None
        
        if not os.path.exists(temp_wav) or os.path.getsize(temp_wav) < 1000:
            print(f"⚠️ FFmpeg output file invalid")
            if os.path.exists(temp_wav):
                os.unlink(temp_wav)
            return None
        
        print(f"✅ FFmpeg converted to: {temp_wav}")
        return temp_wav
        
    except Exception as e:
        print(f"⚠️ FFmpeg error: {e}")
        return None

def test_recording_quality():
    """Test recording quality with FFmpeg support"""
    
    # Find latest recording
    audio_path = find_latest_recording()
    if audio_path is None:
        print("❌ No recording found to test!")
        return
    
    print(f"\n📁 Testing: {audio_path}")
    print(f"📁 File size: {os.path.getsize(audio_path)} bytes")
    
    try:
        # ===== CONVERT WITH FFMPEG FIRST =====
        temp_wav = convert_with_ffmpeg(audio_path)
        
        if temp_wav is None:
            print("❌ Cannot convert audio file!")
            return
        
        # ===== LOAD CONVERTED AUDIO =====
        try:
            import soundfile as sf
            y, sr = sf.read(temp_wav)
            print("✅ Loaded with soundfile")
        except:
            try:
                y, sr = librosa.load(temp_wav, sr=22050)
                print("✅ Loaded with librosa")
            except Exception as e:
                print(f"❌ Load failed: {e}")
                if os.path.exists(temp_wav):
                    os.unlink(temp_wav)
                return
        
        # Clean up temp file
        if os.path.exists(temp_wav):
            os.unlink(temp_wav)
        
        # Check if audio is valid
        if len(y) == 0:
            print("❌ Audio file is empty!")
            return
        
        # ===== ANALYZE AUDIO =====
        print("\n" + "=" * 50)
        print("📊 RECORDING ANALYSIS")
        print("=" * 50)
        
        # 1. Duration
        duration = len(y) / sr
        print(f"   Duration: {duration:.2f} seconds")
        
        # 2. Amplitude
        max_amp = np.max(np.abs(y))
        print(f"   Max Amplitude: {max_amp:.4f}")
        
        if max_amp < 0.01:
            print("   ❌ Recording is too quiet!")
            print("   💡 Speak louder or move closer to microphone")
        elif max_amp > 0.9:
            print("   ⚠️ Recording is too loud (clipping)!")
            print("   💡 Speak quieter or move away from microphone")
        else:
            print(f"   ✅ Amplitude is good: {max_amp:.2f}")
        
        # 3. Energy
        energy = np.mean(y**2)
        print(f"   Energy: {energy:.6f}")
        
        if energy < 0.0001:
            print("   ❌ Energy too low - mostly silence!")
        elif energy > 0.5:
            print("   ⚠️ Energy too high - possible distortion!")
        else:
            print("   ✅ Energy is good")
        
        # 4. SNR (Signal-to-Noise Ratio)
        try:
            import librosa
            harmonic = librosa.effects.harmonic(y)
            noise = y - harmonic
            harmonic_power = np.mean(harmonic**2)
            noise_power = np.mean(noise**2)
            
            if noise_power > 0 and harmonic_power > 0:
                snr = 10 * np.log10(harmonic_power / (noise_power + 1e-10))
                print(f"   SNR: {snr:.1f} dB")
                
                if snr > 20:
                    print("   ✅ Excellent SNR! (> 20 dB)")
                elif snr > 10:
                    print("   ✅ Good SNR (10-20 dB)")
                elif snr > 5:
                    print("   ⚠️ Moderate SNR (5-10 dB) - some noise")
                else:
                    print("   ❌ Poor SNR (< 5 dB) - too much noise!")
            else:
                print("   ⚠️ Cannot calculate SNR - audio might be pure noise")
        except Exception as e:
            print(f"   ⚠️ SNR calculation failed: {e}")
        
        # 5. Silence ratio
        silence_threshold = 0.001
        silence_ratio = np.sum(np.abs(y) < silence_threshold) / len(y)
        print(f"   Silence Ratio: {silence_ratio*100:.1f}%")
        
        if silence_ratio > 50:
            print("   ❌ Too much silence! (> 50%)")
            print("   💡 Speak continuously for 5-10 seconds")
        elif silence_ratio > 30:
            print("   ⚠️ Moderate silence (30-50%)")
        else:
            print("   ✅ Good voice activity (< 30% silence)")
        
        # 6. Check for voice presence
        voice_energy = np.mean(y[np.abs(y) > silence_threshold]**2)
        if voice_energy < 0.0001:
            print("   ❌ No voice detected!")
            print("   💡 Speak clearly and at normal volume")
        else:
            print(f"   ✅ Voice detected: {voice_energy:.6f}")
        
        # ===== OVERALL ASSESSMENT =====
        print("\n" + "=" * 50)
        print("📋 OVERALL ASSESSMENT")
        print("=" * 50)
        
        issues = []
        suggestions = []
        
        if max_amp < 0.01:
            issues.append("❌ Audio is too quiet")
            suggestions.append("Speak louder or move closer to microphone")
        
        if energy < 0.0001:
            issues.append("❌ Energy too low")
            suggestions.append("Speak continuously for 5-10 seconds")
        
        if 'snr' in locals() and snr < 10:
            issues.append(f"❌ SNR too low ({snr:.1f} dB)")
            suggestions.append("Record in a quiet room without background noise")
        
        if silence_ratio > 50:
            issues.append(f"❌ Too much silence ({silence_ratio*100:.1f}%)")
            suggestions.append("Read the text continuously without long pauses")
        
        if issues:
            print("   ❌ Problems found:")
            for issue in issues:
                print(f"      - {issue}")
            print("\n   💡 Suggestions:")
            for suggestion in suggestions:
                print(f"      - {suggestion}")
            print("\n   📱 Tip: Use your phone's microphone for better quality!")
        else:
            print("   ✅ Audio quality is GOOD!")
            print("\n   💡 The recording should give an accurate voice score!")
        
        print("\n" + "=" * 50)
        
        # Return results
        return {
            'duration': duration,
            'max_amplitude': max_amp,
            'energy': energy,
            'snr': snr if 'snr' in locals() else None,
            'silence_ratio': silence_ratio,
            'issues': issues,
            'is_good': len(issues) == 0
        }
        
    except Exception as e:
        print(f"❌ Error analyzing audio: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_recording_quality()