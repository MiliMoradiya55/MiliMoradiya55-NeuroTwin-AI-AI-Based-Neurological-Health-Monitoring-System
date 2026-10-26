# Backend/app/utils/feature_extractor.py

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

class TypingFeatureExtractor:
    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_columns = [
            'hold_time_mean', 'hold_time_std', 'hold_time_min', 'hold_time_max',
            'latency_mean', 'latency_std', 'latency_min', 'latency_max',
            'flight_time_mean', 'flight_time_std', 'flight_time_min', 'flight_time_max',
            'typing_speed', 'key_press_variance', 'rhythm_variance',
            'backspace_frequency', 'error_rate', 'consistency_score'
        ]

    def extract_features_from_typing_data(self, keystrokes):
        """Extract features from keystroke data"""
        if not keystrokes:
            return None

        df = pd.DataFrame(keystrokes)
        
        # Basic statistics
        hold_stats = self._get_stats(df, 'hold_time')
        latency_stats = self._get_stats(df, 'latency')
        flight_stats = self._get_stats(df, 'flight_time')
        
        # Typing speed (keys per minute)
        total_time = sum(df['latency']) if 'latency' in df else 0
        typing_speed = len(df) / (total_time / 60000) if total_time > 0 else 0
        
        # Key press variance
        key_press_variance = np.var(df['latency']) if 'latency' in df else 0
        
        # Rhythm variance
        if 'latency' in df and len(df) > 1:
            rhythm_variance = np.var(np.diff(df['latency']))
        else:
            rhythm_variance = 0
        
        # Backspace frequency
        backspace_count = len(df[df['direction'] == 'S']) if 'direction' in df else 0
        backspace_frequency = backspace_count / len(df) if len(df) > 0 else 0
        
        # Error rate
        error_rate = backspace_frequency
        
        # Consistency score
        consistency_score = 100 - (key_press_variance / 10) if key_press_variance > 0 else 100
        
        features = {
            'hold_time_mean': hold_stats['mean'],
            'hold_time_std': hold_stats['std'],
            'hold_time_min': hold_stats['min'],
            'hold_time_max': hold_stats['max'],
            'latency_mean': latency_stats['mean'],
            'latency_std': latency_stats['std'],
            'latency_min': latency_stats['min'],
            'latency_max': latency_stats['max'],
            'flight_time_mean': flight_stats['mean'],
            'flight_time_std': flight_stats['std'],
            'flight_time_min': flight_stats['min'],
            'flight_time_max': flight_stats['max'],
            'typing_speed': typing_speed,
            'key_press_variance': key_press_variance,
            'rhythm_variance': rhythm_variance,
            'backspace_frequency': backspace_frequency,
            'error_rate': error_rate,
            'consistency_score': min(100, max(0, consistency_score))
        }
        return features

    def _get_stats(self, df, column):
        if column in df and len(df) > 0:
            data = df[column].dropna()
            if len(data) > 0:
                return {
                    'mean': np.mean(data),
                    'std': np.std(data),
                    'min': np.min(data),
                    'max': np.max(data)
                }
        return {'mean': 0, 'std': 0, 'min': 0, 'max': 0}