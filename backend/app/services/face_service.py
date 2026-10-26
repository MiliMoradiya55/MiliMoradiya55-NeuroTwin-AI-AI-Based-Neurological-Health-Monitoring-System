# backend/app/services/face_service.py

import os
import cv2
import numpy as np
import json
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
import warnings
warnings.filterwarnings('ignore')

# ===== FIX: Try Keras 3 first =====
try:
    import keras
    HAS_KERAS = True
    print(f"✅ Keras {keras.__version__} loaded in face_service")
except ImportError:
    try:
        import tensorflow as tf
        from tensorflow import keras
        HAS_KERAS = True
        print(f"✅ TensorFlow Keras loaded")
    except ImportError:
        HAS_KERAS = False
        print("⚠️ Keras not available")

class FaceService:
    def __init__(self, db: Session = None):
        self.db = db
        self.model = None
        self.emotions = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
        self._load_model()
    
    def _load_model(self):
        """Load trained face emotion model"""
        if not HAS_KERAS:
            self.model = None
            return
            
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            models_dir = os.path.join(base_dir, 'models')
            
            # ===== FIX: Try H5 first (most compatible) =====
            possible_paths = [
                os.path.join(models_dir, 'emotion_model.h5'),
                os.path.join(models_dir, 'emotion_model_v2.keras'),
                os.path.join(models_dir, 'emotion_model.keras'),
            ]
            
            model_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    model_path = path
                    break
            
            if model_path is None:
                print(f"⚠️ Face model not found in {models_dir}")
                self.model = None
                return
            
            print(f"📁 Loading model from: {os.path.basename(model_path)}")
            self.model = keras.models.load_model(model_path, compile=False)
            print(f"✅ Face emotion model loaded from: {os.path.basename(model_path)}")
            
            # Load labels
            labels_path = os.path.join(models_dir, 'labels.json')
            if os.path.exists(labels_path):
                with open(labels_path, 'r') as f:
                    labels = json.load(f)
                    self.emotions = labels.get('emotions', self.emotions)
                print(f"✅ {len(self.emotions)} emotions loaded")
            else:
                print(f"⚠️ Labels file not found, using default emotions")
            
        except Exception as e:
            print(f"⚠️ Error loading face model: {e}")
            self.model = None
    
    def preprocess_face(self, face_image: np.ndarray) -> np.ndarray:
        """Preprocess face image for model input"""
        try:
            # Resize to 48x48 (model input size)
            face = cv2.resize(face_image, (48, 48))
            
            # Convert to grayscale
            if len(face.shape) == 3:
                face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
            
            # Histogram equalization for better contrast
            face = cv2.equalizeHist(face)
            
            # Normalize to [0, 1]
            face = face / 255.0
            
            # Add batch and channel dimensions
            face = np.expand_dims(face, axis=0)  # batch
            face = np.expand_dims(face, axis=-1)  # channel
            
            return face
            
        except Exception as e:
            print(f"Error preprocessing face: {e}")
            return None
    
    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """Enhance image quality for better face detection"""
        try:
            # Convert to LAB color space for better contrast
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            l_enhanced = clahe.apply(l)
            
            # Merge back
            lab_enhanced = cv2.merge((l_enhanced, a, b))
            enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
            
            # Denoise
            enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)
            
            return enhanced
            
        except Exception as e:
            print(f"Error enhancing image: {e}")
            return image
    
    def detect_face(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Detect face in image and extract face region - ENHANCED"""
        try:
            # Enhance image first
            enhanced = self.enhance_image(image)
            
            # Convert to grayscale
            gray = cv2.cvtColor(enhanced, cv2.COLOR_BGR2GRAY)
            
            # Method 1: Haar Cascade with multiple scales
            face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            # Try different scale factors
            scales = [1.05, 1.1, 1.15]
            faces = []
            
            for scale in scales:
                detected = face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=scale,
                    minNeighbors=4,
                    minSize=(30, 30),
                    maxSize=(400, 400)
                )
                if len(detected) > 0:
                    faces.extend(detected)
                    break
            
            # Method 2: LBP cascade (faster)
            if len(faces) == 0:
                print("⚠️ Trying LBP cascade...")
                try:
                    lbp_cascade = cv2.CascadeClassifier(
                        cv2.data.haarcascades + 'lbpcascade_frontalface.xml'
                    )
                    faces = lbp_cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.1,
                        minNeighbors=3,
                        minSize=(30, 30)
                    )
                except:
                    pass
            
            # Method 3: Original image (not enhanced)
            if len(faces) == 0:
                print("⚠️ Trying original image...")
                gray_orig = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(
                    gray_orig,
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(30, 30)
                )
            
            if len(faces) == 0:
                print("⚠️ No face detected in image")
                return None
            
            # Choose the largest face
            if len(faces) > 1:
                areas = [w * h for (x, y, w, h) in faces]
                largest_idx = np.argmax(areas)
                x, y, w, h = faces[largest_idx]
            else:
                x, y, w, h = faces[0]
            
            print(f"✅ Face detected: x={x}, y={y}, w={w}, h={h}")
            
            # Extract face with margin
            margin = 30
            x = max(0, x - margin)
            y = max(0, y - margin)
            w = min(image.shape[1] - x, w + 2 * margin)
            h = min(image.shape[0] - y, h + 2 * margin)
            
            face = image[y:y+h, x:x+w]
            
            # Validate face
            if face.size == 0 or face.shape[0] < 20 or face.shape[1] < 20:
                print("⚠️ Face region too small")
                return None
            
            print(f"✅ Face extracted: {face.shape}")
            return face
            
        except Exception as e:
            print(f"Error detecting face: {e}")
            return None
    
    def predict_emotion(self, face: np.ndarray) -> Tuple[str, float, Dict]:
        """Predict emotion from face image"""
        if self.model is None:
            print("⚠️ Model not loaded, returning neutral")
            return "neutral", 0.5, {}
        
        try:
            processed = self.preprocess_face(face)
            if processed is None:
                return "neutral", 0.5, {}
            
            predictions = self.model.predict(processed, verbose=0)[0]
            
            emotion_idx = np.argmax(predictions)
            confidence = float(np.max(predictions))
            emotion = self.emotions[emotion_idx]
            
            print(f"✅ Predicted emotion: {emotion} ({confidence:.2f})")
            
            all_predictions = {
                self.emotions[i]: float(predictions[i]) 
                for i in range(len(self.emotions))
            }
            
            return emotion, confidence, all_predictions
            
        except Exception as e:
            print(f"Error predicting emotion: {e}")
            return "neutral", 0.5, {}
    
    def calculate_facial_metrics(self, face: np.ndarray) -> Dict[str, float]:
        """Calculate comprehensive facial metrics from face image"""
        metrics = {
            'smile_intensity': 0.0,
            'facial_symmetry': 80.0,
            'blink_rate': 16.0,
            'eye_movement': 0.0,
            'facial_muscle_activity': 0.0,
            'mouth_openness': 0.0,
            'eyebrow_position': 0.0,
            'head_tilt': 0.0,
            'skin_tone': 0.0,
            'wrinkle_intensity': 0.0
        }
        
        try:
            gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape
            
            # 1. Smile Intensity (using mouth ROI)
            mouth_roi = gray[int(h*0.6):int(h*0.85), int(w*0.2):int(w*0.8)]
            if mouth_roi.size > 0:
                mouth_intensity = np.mean(mouth_roi)
                metrics['smile_intensity'] = max(0, min(1, (255 - mouth_intensity) / 255))
            
            # 2. Facial Symmetry (using left-right comparison)
            left_half = gray[:, :w//2]
            right_half = gray[:, w//2:]
            right_half_flipped = cv2.flip(right_half, 1)
            if left_half.shape == right_half_flipped.shape:
                diff = cv2.absdiff(left_half, right_half_flipped)
                symmetry_score = 100 - (np.mean(diff) / 2.55)
                metrics['facial_symmetry'] = max(0, min(100, symmetry_score))
            
            # 3. Blink Rate (using eye detection)
            eye_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_eye.xml'
            )
            eyes = eye_cascade.detectMultiScale(gray, 1.1, 4)
            if len(eyes) >= 2:
                metrics['eye_movement'] = min(100, len(eyes) * 10)
                metrics['blink_rate'] = 16 + (len(eyes) - 2) * 2
            
            # 4. Mouth Openness
            if mouth_roi.size > 0:
                mouth_height = np.std(mouth_roi)
                metrics['mouth_openness'] = min(100, mouth_height * 2)
            
            # 5. Eyebrow Position
            eyebrow_roi = gray[int(h*0.1):int(h*0.3), int(w*0.2):int(w*0.8)]
            if eyebrow_roi.size > 0:
                metrics['eyebrow_position'] = np.mean(eyebrow_roi) / 255 * 100
            
            # 6. Head Tilt (using face shape)
            if h > 0 and w > 0:
                aspect_ratio = w / h
                if aspect_ratio > 1.2:
                    metrics['head_tilt'] = min(100, (aspect_ratio - 1) * 100)
            
            # 7. Skin Tone
            skin_roi = gray[int(h*0.2):int(h*0.6), int(w*0.2):int(w*0.8)]
            if skin_roi.size > 0:
                metrics['skin_tone'] = np.mean(skin_roi) / 255 * 100
            
            # 8. Wrinkle Intensity
            edges = cv2.Canny(gray, 50, 150)
            wrinkle_roi = edges[int(h*0.3):int(h*0.7), int(w*0.2):int(w*0.8)]
            if wrinkle_roi.size > 0:
                metrics['wrinkle_intensity'] = np.sum(wrinkle_roi) / wrinkle_roi.size
            
            # 9. Facial Muscle Activity
            metrics['facial_muscle_activity'] = (
                metrics['smile_intensity'] * 30 + 
                metrics['eye_movement'] * 20 + 
                metrics['mouth_openness'] * 10 + 40
            )
            
        except Exception as e:
            print(f"Error calculating facial metrics: {e}")
        
        return metrics
    
    def calculate_score(self, emotion: str, confidence: float, metrics: Dict[str, float]) -> float:
        """Calculate overall health score (0-100)"""
        # Base score from emotion confidence
        base_score = confidence * 70
        
        # Bonus for positive emotions
        if emotion in ['happy']:
            base_score += 20
        elif emotion in ['neutral']:
            base_score += 10
        elif emotion in ['sad', 'fear']:
            base_score -= 5
        elif emotion in ['angry']:
            base_score -= 10
        
        # Bonus for facial symmetry
        symmetry = metrics.get('facial_symmetry', 50)
        if symmetry > 85:
            base_score += 10
        elif symmetry > 70:
            base_score += 5
        elif symmetry < 60:
            base_score -= 5
        
        # Bonus for smile
        smile = metrics.get('smile_intensity', 0)
        if smile > 0.6:
            base_score += 10
        elif smile > 0.3:
            base_score += 5
        
        # Normal blink rate bonus (15-20 per min is healthy)
        blink = metrics.get('blink_rate', 16)
        if 14 <= blink <= 22:
            base_score += 5
        elif blink < 10 or blink > 30:
            base_score -= 5
        
        # Muscle activity bonus
        muscle = metrics.get('facial_muscle_activity', 50)
        if muscle > 70:
            base_score += 5
        
        # Ensure score is between 0 and 100
        return max(0, min(100, base_score))
    
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Complete face analysis from image"""
        try:
            print(f"📁 Analyzing image: {image_path}")
            img = cv2.imread(image_path)
            if img is None:
                return {
                    "error": "Failed to load image",
                    "emotion": "Unknown",
                    "score": 50.0,
                    "confidence": 50.0,
                    "facial_metrics": {}
                }
            
            # Save debug image
            debug_path = image_path.replace('.jpg', '_debug.jpg')
            cv2.imwrite(debug_path, img)
            print(f"📁 Debug image saved: {debug_path}")
            
            # Detect face
            face = self.detect_face(img)
            if face is None:
                return {
                    "error": "No face detected in image",
                    "emotion": "Unknown",
                    "score": 50.0,
                    "confidence": 50.0,
                    "facial_metrics": {}
                }
            
            # Predict emotion
            emotion, confidence, all_predictions = self.predict_emotion(face)
            
            # Calculate facial metrics
            facial_metrics = self.calculate_facial_metrics(face)
            
            # Calculate overall score
            score = self.calculate_score(emotion, confidence, facial_metrics)
            
            result = {
                "emotion": emotion,
                "score": score,
                "confidence": confidence * 100,
                "all_predictions": all_predictions,
                "facial_metrics": facial_metrics,
                "face_detected": True
            }
            print(f"✅ Result: {result}")
            return result
            
        except Exception as e:
            print(f"❌ Error analyzing face: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "emotion": "Unknown",
                "score": 50.0,
                "confidence": 50.0,
                "facial_metrics": {}
            }
    
    def create_assessment(self, user_id: int, image_path: str) -> Dict[str, Any]:
        """Create face assessment and store in database"""
        result = self.analyze_image(image_path)
        
        if self.db and not result.get('error'):
            try:
                from app.models.face import FaceAssessment
                from app.models.twin import DigitalTwin
                
                # Get or create digital twin
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
                
                metrics = result.get('facial_metrics', {})
                
                # Create assessment
                assessment = FaceAssessment(
                    user_id=user_id,
                    twin_id=twin.id,
                    image_path=image_path,
                    emotion=result.get('emotion', 'unknown'),
                    smile_intensity=metrics.get('smile_intensity', 0),
                    facial_symmetry=metrics.get('facial_symmetry', 0),
                    blink_rate=metrics.get('blink_rate', 0),
                    eye_movement=metrics.get('eye_movement', 0),
                    facial_muscle_activity=metrics.get('facial_muscle_activity', 0),
                    score=result.get('score', 0),
                    accuracy=result.get('confidence', 0),
                    status='completed',
                    completed_at=datetime.utcnow()
                )
                
                self.db.add(assessment)
                self.db.commit()
                self.db.refresh(assessment)
                
                result['assessment_id'] = assessment.id
                
            except Exception as e:
                print(f"❌ Database error: {e}")
                self.db.rollback()
        
        return result