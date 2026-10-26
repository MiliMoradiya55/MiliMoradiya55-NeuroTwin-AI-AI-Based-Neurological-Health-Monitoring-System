
# Face detection using MediaPipe

import cv2
import mediapipe as mp
import numpy as np
from .config import MIN_DETECTION_CONFIDENCE, MIN_TRACKING_CONFIDENCE

class FaceDetector:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.mp_drawing = mp.solutions.drawing_utils
        
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=MIN_DETECTION_CONFIDENCE
        )
        
        self.face_mesh = mp.solutions.face_mesh
        self.face_mesh_detection = self.face_mesh.FaceMesh(
            max_num_faces=1,
            min_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=MIN_TRACKING_CONFIDENCE
        )
    
    def detect_faces(self, image):
        """
        Detect faces in the image
        Returns: List of bounding boxes and landmarks
        """
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_detection.process(rgb_image)
        
        faces = []
        if results.detections:
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                h, w, _ = image.shape
                
                # Convert relative coordinates to absolute
                x = int(bbox.xmin * w)
                y = int(bbox.ymin * h)
                width = int(bbox.width * w)
                height = int(bbox.height * h)
                
                # Ensure coordinates are within image bounds
                x = max(0, x)
                y = max(0, y)
                width = min(width, w - x)
                height = min(height, h - y)
                
                faces.append({
                    'bbox': (x, y, width, height),
                    'confidence': detection.score[0],
                    'landmarks': detection.location_data.relative_keypoints
                })
        
        return faces
    
    def get_face_region(self, image, bbox, padding=20):
        """
        Extract face region from image
        """
        x, y, width, height = bbox
        
        # Add padding
        x = max(0, x - padding)
        y = max(0, y - padding)
        width = min(width + 2*padding, image.shape[1] - x)
        height = min(height + 2*padding, image.shape[0] - y)
        
        face = image[y:y+height, x:x+width]
        return face
    
    def get_facial_features(self, image):
        """
        Get facial features using face mesh
        """
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh_detection.process(rgb_image)
        
        features = {}
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0]
            
            # Extract specific facial features
            # This can be extended based on specific needs
            features['landmarks'] = landmarks
            features['num_landmarks'] = len(landmarks.landmark)
            
        return features
    
    def draw_detections(self, image, faces):
        """
        Draw face detection results on the image
        """
        for face in faces:
            x, y, width, height = face['bbox']
            
            # Draw bounding box
            cv2.rectangle(image, (x, y), (x+width, y+height), (0, 255, 0), 2)
            
            # Draw confidence
            confidence = face['confidence']
            cv2.putText(image, f"{confidence:.2f}", 
                       (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.5, (0, 255, 0), 2)
            
            # Draw landmarks if available
            if 'landmarks' in face:
                for landmark in face['landmarks']:
                    h, w, _ = image.shape
                    lx = int(landmark.x * w)
                    ly = int(landmark.y * h)
                    cv2.circle(image, (lx, ly), 2, (255, 0, 0), -1)
        
        return image