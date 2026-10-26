"""
Lightweight real-time face emotion detection optimized for NeuroTwin AI
"""

import cv2
import numpy as np
import time
import json
import os
from datetime import datetime
from collections import deque

from utils.mediapipe_face import FaceDetector
from utils.config import MODELS_PATH, OUTPUTS_PATH, EMOTIONS
from training.save_labels import load_labels

class RealTimeFaceAnalyzer:
    """
    Optimized real-time face emotion analyzer for NeuroTwin AI
    """
    def __init__(self, model_path=None):
        # Load labels
        self.labels = load_labels()
        self.emotions = self.labels['emotions'] if self.labels else EMOTIONS
        
        # Load model
        self.model_path = model_path
        self.model = None
        self.load_model()
        
        # Initialize face detector
        self.face_detector = FaceDetector()
        
        # Tracking variables
        self.frame_count = 0
        self.fps = 0
        self.start_time = time.time()
        
        # Emotion history for smoothing
        self.emotion_history = deque(maxlen=10)
        self.confidence_history = deque(maxlen=10)
        
        # Facial movement tracking for NeuroTwin AI
        self.facial_features_history = deque(maxlen=100)
        
        # Detection settings
        self.detection_interval = 5  # Process every 5 frames
        self.confidence_threshold = 0.5
        
        # Output tracking
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.results_log = []
        
    def load_model(self):
        """Load the trained model"""
        if self.model_path is None:
            possible_paths = [
                os.path.join(MODELS_PATH, 'emotion_model.keras'),
                os.path.join(MODELS_PATH, 'best_model.keras')
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    self.model_path = path
                    break
        
        if self.model_path is None:
            raise FileNotFoundError("No model found in models directory")
        
        import tensorflow as tf
        self.model = tf.keras.models.load_model(self.model_path)
        print(f"Model loaded from {self.model_path}")
        
    def preprocess_face(self, face_image):
        """Preprocess face image for model input"""
        # Resize
        face = cv2.resize(face_image, (48, 48))
        
        # Convert to grayscale if needed
        if len(face.shape) == 3:
            face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
        
        # Equalize histogram
        face = cv2.equalizeHist(face)
        
        # Normalize
        face = face / 255.0
        
        # Add dimensions
        face = np.expand_dims(face, axis=0)  # batch
        face = np.expand_dims(face, axis=-1)  # channel
        
        return face
    
    def predict_emotion(self, face_image):
        """Predict emotion from face image"""
        processed_face = self.preprocess_face(face_image)
        
        # Predict
        predictions = self.model.predict(processed_face, verbose=0)[0]
        
        # Get emotion and confidence
        emotion_idx = np.argmax(predictions)
        confidence = np.max(predictions)
        
        # Only return if confidence is high enough
        if confidence >= self.confidence_threshold:
            emotion = self.emotions[emotion_idx]
        else:
            emotion = "neutral"
            confidence = 1.0 - confidence
        
        return emotion, confidence, predictions
    
    def analyze_facial_movement(self, face_image, face_landmarks):
        """Analyze facial movements for NeuroTwin AI"""
        movement_data = {
            'smile_intensity': 0.0,
            'facial_symmetry': 0.0,
            'blink_frequency': 0.0,
            'eye_movement': 0.0,
            'facial_muscle_activity': 0.0,
            'timestamp': time.time()
        }
        
        if face_landmarks:
            # Extract landmark information
            # This is a placeholder - implement specific facial analysis
            pass
        
        self.facial_features_history.append(movement_data)
        return movement_data
    
    def process_frame(self, frame):
        """Process a single frame"""
        self.frame_count += 1
        
        # Only process every Nth frame for performance
        if self.frame_count % self.detection_interval != 0:
            return frame, None
        
        # Detect faces
        faces = self.face_detector.detect_faces(frame)
        
        if not faces:
            return frame, None
        
        # Process first face
        face = faces[0]
        bbox = face['bbox']
        
        # Extract face region
        face_region = self.face_detector.get_face_region(frame, bbox)
        
        if face_region.size == 0:
            return frame, None
        
        # Get facial landmarks
        facial_features = self.face_detector.get_facial_features(face_region)
        
        # Predict emotion
        emotion, confidence, predictions = self.predict_emotion(face_region)
        
        # Update history
        self.emotion_history.append(emotion)
        self.confidence_history.append(confidence)
        
        # Get smoothed emotion
        if len(self.emotion_history) > 0:
            from collections import Counter
            smoothed_emotion = Counter(self.emotion_history).most_common(1)[0][0]
            smoothed_confidence = np.mean(self.confidence_history)
        else:
            smoothed_emotion = emotion
            smoothed_confidence = confidence
        
        # Analyze facial movement
        movement_data = self.analyze_facial_movement(face_region, facial_features)
        
        # Create result
        result = {
            'emotion': smoothed_emotion,
            'confidence': smoothed_confidence,
            'all_predictions': {self.emotions[i]: float(predictions[i]) 
                              for i in range(len(self.emotions))},
            'facial_movement': movement_data,
            'bbox': bbox,
            'frame_count': self.frame_count
        }
        
        # Log results
        self.results_log.append(result)
        
        # Draw results
        frame = self.draw_results(frame, result)
        
        return frame, result
    
    def draw_results(self, frame, result):
        """Draw detection results on frame"""
        x, y, width, height = result['bbox']
        emotion = result['emotion']
        confidence = result['confidence']
        
        # Color coding for emotions
        emotion_colors = {
            'angry': (0, 0, 255),
            'disgust': (0, 128, 128),
            'fear': (255, 255, 0),
            'happy': (0, 255, 0),
            'neutral': (255, 255, 255),
            'sad': (255, 0, 0),
            'surprise': (255, 0, 255)
        }
        color = emotion_colors.get(emotion, (0, 255, 0))
        
        # Draw bounding box
        cv2.rectangle(frame, (x, y), (x+width, y+height), color, 2)
        
        # Draw emotion label
        label = f"{emotion}: {confidence:.2f}"
        label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
        
        # Draw background for label
        cv2.rectangle(frame, (x, y-25), (x+label_size[0], y), color, -1)
        cv2.putText(frame, label, (x, y-5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
        
        # Draw confidence bar
        bar_x = x
        bar_y = y + height + 10
        bar_width = width
        bar_height = 5
        
        cv2.rectangle(frame, (bar_x, bar_y), 
                     (bar_x + int(bar_width * confidence), bar_y + bar_height),
                     color, -1)
        
        # Draw all predictions in a small window
        if 'all_predictions' in result:
            preds = result['all_predictions']
            sorted_preds = sorted(preds.items(), key=lambda x: x[1], reverse=True)
            
            # Draw at top right corner
            pred_x = 10
            pred_y = 50
            for i, (emo, conf) in enumerate(sorted_preds[:5]):
                color = emotion_colors.get(emo, (255, 255, 255))
                text = f"{emo}: {conf:.2f}"
                cv2.putText(frame, text, (pred_x, pred_y + i*25),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
        
        return frame
    
    def save_results(self):
        """Save analysis results to file"""
        if not self.results_log:
            return
        
        output_path = os.path.join(OUTPUTS_PATH, 'predictions', 
                                  f'session_{self.session_id}.json')
        
        # Convert timestamps to string
        for result in self.results_log:
            if 'facial_movement' in result:
                result['facial_movement']['timestamp'] = \
                    datetime.fromtimestamp(result['facial_movement']['timestamp']).isoformat()
        
        with open(output_path, 'w') as f:
            json.dump(self.results_log, f, indent=2)
        
        print(f"Results saved to {output_path}")
        return output_path
    
    def run_webcam(self):
        """Main webcam loop"""
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("Error: Could not open webcam")
            return
        
        # Set properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        print("Real-Time Face Analysis Started")
        print("Press 'q' to quit, 's' to save results")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Flip for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame
            processed_frame, result = self.process_frame(frame)
            
            # Calculate and display FPS
            if self.frame_count % 30 == 0:
                end_time = time.time()
                self.fps = 30 / (end_time - self.start_time)
                self.start_time = time.time()
            
            cv2.putText(processed_frame, f"FPS: {self.fps:.1f}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.6, (255, 255, 255), 2)
            
            # Show frame
            cv2.imshow('NeuroTwin AI - Face Emotion Analysis', processed_frame)
            
            # Handle keys
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                self.save_results()
        
        cap.release()
        cv2.destroyAllWindows()
        
        # Save results on exit
        self.save_results()
        print("Analysis completed")

def main():
    """Main entry point"""
    print("NeuroTwin AI - Real-Time Face Emotion Analysis")
    analyzer = RealTimeFaceAnalyzer()
    analyzer.run_webcam()

if __name__ == "__main__":
    main()