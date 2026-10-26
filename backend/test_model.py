# Backend/test_model.py

import os
import numpy as np
import joblib
from tensorflow.keras.models import load_model

def test_model():
    print("=" * 60)
    print("Testing LSTM Typing Model")
    print("=" * 60)
    
    # Load model
    try:
        model = load_model('models/typing_lstm.h5')
        print("✅ Model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return
    
    # Load scaler
    try:
        scaler = joblib.load('models/scaler.pkl')
        print("✅ Scaler loaded successfully")
    except Exception as e:
        print(f"❌ Error loading scaler: {e}")
        return
    
    # Generate sample keystroke data
    print("\n📝 Generating sample keystroke data...")
    
    # Simulate normal typing (healthy)
    healthy_keystrokes = []
    for i in range(20):
        healthy_keystrokes.append({
            'hold_time': np.random.normal(80, 10),
            'latency': np.random.normal(150, 20),
            'flight_time': np.random.normal(50, 10),
            'hand': 'R' if i % 2 == 0 else 'L',
            'direction': 'S'
        })
    
    # Simulate Parkinson's typing (tremor)
    parkinson_keystrokes = []
    for i in range(20):
        parkinson_keystrokes.append({
            'hold_time': np.random.normal(120, 30),
            'latency': np.random.normal(250, 50),
            'flight_time': np.random.normal(80, 25),
            'hand': 'R' if i % 2 == 0 else 'L',
            'direction': 'S'
        })
    
    # Extract features
    from train_typing_model import TypingFeatureExtractor
    extractor = TypingFeatureExtractor()
    
    # Process healthy
    healthy_features = extractor.extract_features_from_typing_data(healthy_keystrokes)
    healthy_normalized = scaler.transform([list(healthy_features.values())])
    
    # Process Parkinson's
    parkinson_features = extractor.extract_features_from_typing_data(parkinson_keystrokes)
    parkinson_normalized = scaler.transform([list(parkinson_features.values())])
    
    # Create sequences (duplicate for LSTM)
    sequence_length = 10
    healthy_seq = np.array([healthy_normalized[0]] * sequence_length).reshape(1, sequence_length, -1)
    parkinson_seq = np.array([parkinson_normalized[0]] * sequence_length).reshape(1, sequence_length, -1)
    
    # Predict
    healthy_pred = model.predict(healthy_seq, verbose=0)[0][0]
    parkinson_pred = model.predict(parkinson_seq, verbose=0)[0][0]
    
    print("\n📊 Prediction Results:")
    print("-" * 40)
    print(f"Healthy typing risk score: {healthy_pred:.4f}")
    print(f"Parkinson's typing risk score: {parkinson_pred:.4f}")
    print(f"Health score (Healthy): {int((1 - healthy_pred) * 100)}/100")
    print(f"Health score (Parkinson's): {int((1 - parkinson_pred) * 100)}/100")
    print("-" * 40)
    
    if healthy_pred < parkinson_pred:
        print("\n✅ Model correctly identifies healthy vs Parkinson's typing patterns!")
    else:
        print("\n⚠️ Model could not differentiate. May need more training data.")
    
    print("\n" + "=" * 60)
    print("✅ Test complete!")

if __name__ == "__main__":
    test_model()