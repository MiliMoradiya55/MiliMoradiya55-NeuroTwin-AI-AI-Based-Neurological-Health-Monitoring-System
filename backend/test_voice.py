# backend/test_voice_quality.py

import librosa
import numpy as np
import soundfile as sf

def generate_test_voice():
    """Generate a synthetic voice-like audio for testing"""
    sr = 22050
    duration = 4.0
    t = np.linspace(0, duration, int(sr * duration))
    
    # Fundamental frequency (pitch) - 145 Hz (healthy voice)
    f0 = 145
    
    # Generate signal with harmonics (like human voice)
    y = 0.5 * np.sin(2 * np.pi * f0 * t)
    y += 0.3 * np.sin(2 * np.pi * 2 * f0 * t)   # 2nd harmonic
    y += 0.2 * np.sin(2 * np.pi * 3 * f0 * t)   # 3rd harmonic
    y += 0.1 * np.sin(2 * np.pi * 4 * f0 * t)   # 4th harmonic
    
    # Add slight vibrato (natural voice)
    vibrato = 0.05 * np.sin(2 * np.pi * 5 * t)
    y = y * (1 + vibrato)
    
    # Add some natural variation
    y = y + 0.02 * np.random.randn(len(y))
    
    # Normalize
    y = y / np.max(np.abs(y))
    
    # Save
    sf.write('test_voice_quality.wav', y, sr)
    print("✅ Test voice created: test_voice_quality.wav")
    return 'test_voice_quality.wav'

def test_quality():
    """Test the quality validation"""
    from app.services.voice_service import VoiceService
    
    audio_path = generate_test_voice()
    service = VoiceService()
    
    result = service.analyze_voice(audio_path)
    
    print("\n📊 Test Results:")
    print(f"   Score: {result['score']:.1f}/100")
    print(f"   Confidence: {result['confidence']:.1f}%")
    print(f"   Pitch: {result['metrics']['pitch']:.1f} Hz")
    print(f"   Jitter: {result['metrics']['jitter']:.2f}%")
    print(f"   Shimmer: {result['metrics']['shimmer']:.2f}%")
    print(f"   HNR: {result['metrics']['hnr']:.1f} dB")
    print(f"   Tremor: {result['metrics']['voice_tremor']:.2f} Hz")
    print(f"   Speech Rate: {result['metrics']['speech_rate']:.2f} s")

if __name__ == "__main__":
    test_quality()