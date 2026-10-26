# backend/feature_extraction.py

import numpy as np
import math
from typing import List, Dict, Any

class FeatureExtractor:
    """Extract clinical features from hand landmarks"""
    
    def __init__(self):
        self.wrist_idx = 0
        self.index_tip_idx = 8
        self.middle_tip_idx = 12
        self.ring_tip_idx = 16
        self.pinky_tip_idx = 20
        self.thumb_tip_idx = 4
        
    def extract_features_from_landmarks(self, landmarks_list: List[List[Dict]]) -> Dict[str, float]:
        """Extract clinical features from hand landmarks"""
        if not landmarks_list or len(landmarks_list) < 10:
            return None
        
        try:
            frames = len(landmarks_list)
            num_landmarks = len(landmarks_list[0])
            
            landmark_series = np.zeros((frames, num_landmarks, 2))
            for i, frame_landmarks in enumerate(landmarks_list):
                for j, lm in enumerate(frame_landmarks):
                    landmark_series[i, j, 0] = lm.get('x', 0.5)
                    landmark_series[i, j, 1] = lm.get('y', 0.5)
            
            wrist_idx = self.wrist_idx
            index_tip_idx = self.index_tip_idx
            middle_tip_idx = self.middle_tip_idx
            
            wrist_x = landmark_series[:, wrist_idx, 0]
            wrist_y = landmark_series[:, wrist_idx, 1]
            index_x = landmark_series[:, index_tip_idx, 0]
            index_y = landmark_series[:, index_tip_idx, 1]
            middle_x = landmark_series[:, middle_tip_idx, 0]
            middle_y = landmark_series[:, middle_tip_idx, 1]
            
            hand_center_x = (index_x + middle_x) / 2
            hand_center_y = (index_y + middle_y) / 2
            
            tremor_frequency = self._calculate_tremor_frequency(hand_center_x, hand_center_y)
            tremor_amplitude = self._calculate_tremor_amplitude(hand_center_x, hand_center_y)
            hand_stability = self._calculate_hand_stability(hand_center_x, hand_center_y)
            jerk = self._calculate_jerk(hand_center_x, hand_center_y)
            variance = self._calculate_variance(hand_center_x, hand_center_y)
            range_movement = self._calculate_range_movement(hand_center_x, hand_center_y)
            wrist_stability = self._calculate_wrist_stability(wrist_x, wrist_y)
            wrist_movement = self._calculate_wrist_movement(wrist_x, wrist_y)
            
            return {
                'tremor_frequency': tremor_frequency,
                'tremor_amplitude': tremor_amplitude,
                'hand_stability': hand_stability,
                'jerk': jerk,
                'variance': variance,
                'range_movement': range_movement,
                'wrist_stability': wrist_stability,
                'wrist_movement': wrist_movement
            }
            
        except Exception as e:
            print(f"Error extracting features: {e}")
            return None
    
    def _calculate_tremor_frequency(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            signal = x + y - np.mean(x) - np.mean(y)
            fft = np.fft.fft(signal)
            freqs = np.fft.fftfreq(len(signal), 1/30)
            magnitude = np.abs(fft)
            valid_indices = np.where((freqs >= 2) & (freqs <= 15))[0]
            if len(valid_indices) > 0:
                dominant_idx = valid_indices[np.argmax(magnitude[valid_indices])]
                return abs(freqs[dominant_idx])
            return 0.0
        except:
            return 0.0
    
    def _calculate_tremor_amplitude(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            displacement = np.sqrt(np.diff(x)**2 + np.diff(y)**2)
            return min(np.mean(displacement) * 100, 50)
        except:
            return 0.0
    
    def _calculate_hand_stability(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            stability = 100 - ((np.std(x) + np.std(y)) * 150)
            return max(0, min(100, stability))
        except:
            return 50.0
    
    def _calculate_jerk(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            jerk_x = np.mean(np.abs(np.diff(np.diff(np.diff(x)))))
            jerk_y = np.mean(np.abs(np.diff(np.diff(np.diff(y)))))
            return (jerk_x + jerk_y) * 1000
        except:
            return 0.0
    
    def _calculate_variance(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            return np.var(x) + np.var(y)
        except:
            return 0.0
    
    def _calculate_range_movement(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            return ((np.max(x) - np.min(x)) + (np.max(y) - np.min(y))) * 100
        except:
            return 0.0
    
    def _calculate_wrist_stability(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            stability = 100 - ((np.std(x) + np.std(y)) * 100)
            return max(0, min(100, stability))
        except:
            return 50.0
    
    def _calculate_wrist_movement(self, x: np.ndarray, y: np.ndarray) -> float:
        try:
            displacement = np.sqrt(np.diff(x)**2 + np.diff(y)**2)
            return np.mean(displacement) * 100
        except:
            return 0.0