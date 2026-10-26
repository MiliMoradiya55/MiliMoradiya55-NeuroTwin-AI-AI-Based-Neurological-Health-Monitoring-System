# Backend/app/services/typing_service.py

import numpy as np
import os
import joblib
from tensorflow.keras.models import load_model
from app.utils.feature_extractor import TypingFeatureExtractor

class TypingPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.sequence_length = 10
        self.feature_dim = 18
        self.is_loaded = False
        self.load_model()

    def load_model(self, model_path='models/typing_lstm.h5', scaler_path='models/scaler.pkl'):
        """Load the trained LSTM model and scaler"""
        try:
            if os.path.exists(model_path):
                self.model = load_model(model_path)
                print("✅ LSTM model loaded successfully")
            else:
                print(f"⚠️ Model not found at {model_path}")
                return False
            
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                print("✅ Scaler loaded successfully")
            else:
                print(f"⚠️ Scaler not found at {scaler_path}")
                return False
            
            self.is_loaded = True
            return True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False

    def predict_from_keystrokes(self, keystrokes):
        """Predict score from keystroke data"""
        if not self.is_loaded:
            return self._get_fallback_result()

        try:
            # Extract features
            extractor = TypingFeatureExtractor()
            features = extractor.extract_features_from_typing_data(keystrokes)
            
            if not features:
                return self._get_fallback_result()
            
            # Normalize features
            normalized = self.scaler.transform([list(features.values())])
            
            # Reshape for LSTM (sequence of 10)
            sequence = np.array([normalized[0]] * self.sequence_length)
            sequence = sequence.reshape(1, self.sequence_length, -1)
            
            # Predict
            risk_score = float(self.model.predict(sequence, verbose=0)[0][0])
            
            # Calculate typing score (0-100)
            score = int((1 - risk_score) * 100)
            
            # Determine status
            if score >= 90:
                status = "Optimal"
            elif score >= 80:
                status = "Good"
            elif score >= 70:
                status = "Monitor"
            else:
                status = "Action Required"
            
            return {
                'score': score,
                'risk_score': round(risk_score, 4),
                'status': status,
                'metrics': {
                    'typing_speed': round(features.get('typing_speed', 0), 2),
                    'key_latency': round(features.get('latency_mean', 0), 2),
                    'rhythm_variance': round(features.get('rhythm_variance', 0), 2),
                    'consistency': round(features.get('consistency_score', 0), 2),
                    'error_rate': round(features.get('error_rate', 0), 4)
                }
            }
            
        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return self._get_fallback_result()

    def _get_fallback_result(self):
        """Return fallback result when model not available"""
        return {
            'score': 85,
            'risk_score': 0.15,
            'status': "Good",
            'metrics': {
                'typing_speed': 0,
                'key_latency': 0,
                'rhythm_variance': 0,
                'consistency': 0,
                'error_rate': 0
            }
        }