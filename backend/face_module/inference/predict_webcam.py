"""
Real-time emotion prediction using webcam with mediapipe face detection
"""

import cv2
import numpy as np
import time
from collections import deque

from utils.mediapipe_face import FaceDetector
from .predict_image import EmotionPredictor
from utils.config import CONFIDENCE_THRESHOLD

class WebcamEmotionPredictor:
    def __init__(self, model_path=None):
        self.emotion_predictor = EmotionPredictor(model_path)
        self.face_detector = FaceDetector()
        self.confidence_threshold = CONFIDENCE_THRESHOLD
        
        # For smoothing predictions
        self.prediction_history = deque(maxlen=10)
        self.emotion_history = deque(maxlen=5)
        self.current_emotion = "neutral"
        self.last_update_time = time.time()
        self.update_interval = 0.3  # Update every 0.3 seconds
        
    def process_frame(self, frame):
        """
        Process a single frame for emotion detection
        """
        # Detect faces
        faces = self.face_detector.detect_faces(frame)
        
        if not faces:
            return frame, None
        
        # Process the first detected face
        face = faces[0]
        bbox = face['bbox']
        
        # Extract face region
        face_region = self.face_detector.get_face_region(frame, bbox)
        
        if face_region.size == 0:
            return frame, None
        
        # Predict emotion
        result = self.emotion_predictor.predict_image_array(face_region, show=False)
        
        # Add to history for smoothing
        current_time = time.time()
        if current_time - self.last_update_time > self.update_interval:
            self.prediction_history.append(result['predictions'])
            
            # Average predictions
            if len(self.prediction_history) > 0:
                avg_predictions = {}
                for emotion in self.prediction_history[0].keys():
                    avg_predictions[emotion] = np.mean([
                        p[emotion] for p in self.prediction_history
                    ])
                
                # Get best emotion
                best_emotion = max(avg_predictions, key=avg_predictions.get)
                best_confidence = avg_predictions[best_emotion]
                
                if best_confidence >= self.confidence_threshold:
                    self.emotion_history.append(best_emotion)
                    
                    # Get most common emotion
                    if len(self.emotion_history) > 0:
                        from collections import Counter
                        self.current_emotion = Counter(self.emotion_history).most_common(1)[0][0]
            
            self.last_update_time = current_time
        
        # Draw results on frame
        x, y, width, height = bbox
        
        # Bounding box color based on emotion
        emotion_colors = {
            'angry': (0, 0, 255),
            'disgust': (0, 128, 128),
            'fear': (255, 255, 0),
            'happy': (0, 255, 0),
            'neutral': (255, 255, 255),
            'sad': (255, 0, 0),
            'surprise': (255, 0, 255)
        }
        color = emotion_colors.get(self.current_emotion, (0, 255, 0))
        
        # Draw rectangle
        cv2.rectangle(frame, (x, y), (x+width, y+height), color, 2)
        
        # Draw emotion label
        label = f"{self.current_emotion}"
        if 'confidence' in result:
            confidence = result['confidence']
            label += f" ({confidence:.2f})"
        
        cv2.putText(frame, label, (x, y-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Draw all predictions as small bar chart
        if result and 'predictions' in result:
            preds = result['predictions']
            sorted_preds = sorted(preds.items(), key=lambda x: x[1], reverse=True)
            
            bar_x = x + width + 10
            bar_y = y
            bar_width = 150
            bar_height = 20
            
            for i, (emotion, conf) in enumerate(sorted_preds[:5]):
                y_pos = bar_y + i * (bar_height + 5)
                # Draw bar
                cv2.rectangle(frame, 
                            (bar_x, y_pos), 
                            (int(bar_x + bar_width * conf), y_pos + bar_height),
                            (0, 255, 0), -1)
                # Draw label
                cv2.putText(frame, f"{emotion}: {conf:.2f}", 
                           (bar_x + 5, y_pos + 15),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
        
        return frame, result
    
    def run_webcam(self):
        """
        Run real-time emotion detection from webcam
        """
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("Error: Could not open webcam")
            return
        
        # Set webcam properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        print("Webcam started. Press 'q' to quit, 's' to save screenshot")
        
        frame_count = 0
        start_time = time.time()
        fps = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to capture frame")
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame
            processed_frame, result = self.process_frame(frame)
            
            # Calculate FPS
            frame_count += 1
            if frame_count % 30 == 0:
                end_time = time.time()
                fps = 30 / (end_time - start_time)
                start_time = time.time()
            
            # Display FPS
            cv2.putText(processed_frame, f"FPS: {fps:.1f}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.6, (255, 255, 255), 2)
            
            # Display instructions
            cv2.putText(processed_frame, "Press 'q' to quit, 's' to save", 
                       (10, processed_frame.shape[0] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
            # Show frame
            cv2.imshow('Face Emotion Detection', processed_frame)
            
            # Handle keyboard input
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                # Save screenshot
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = f"screenshot_{timestamp}.jpg"
                cv2.imwrite(filename, processed_frame)
                print(f"Screenshot saved to {filename}")
        
        cap.release()
        cv2.destroyAllWindows()
        print("Webcam stopped")

def run_webcam_emotion():
    """Main function to run webcam emotion detection"""
    predictor = WebcamEmotionPredictor()
    predictor.run_webcam()

if __name__ == "__main__":
    run_webcam_emotion()