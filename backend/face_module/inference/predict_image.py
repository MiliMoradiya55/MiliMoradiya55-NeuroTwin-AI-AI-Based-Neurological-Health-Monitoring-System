"""
Predict emotion from a single image
"""

import os
import cv2
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

from utils.config import MODELS_PATH, EMOTIONS
from utils.preprocessing import preprocess_image
from training.save_labels import load_labels

class EmotionPredictor:
    def __init__(self, model_path=None):
        self.model = None
        self.model_path = model_path
        self.emotions = EMOTIONS
        
        # Load labels
        labels = load_labels()
        if labels is not None:
            self.emotions = labels['emotions']
        
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        if self.model_path is None:
            # Try multiple paths
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
        
        self.model = tf.keras.models.load_model(self.model_path)
        print(f"Model loaded from {self.model_path}")
        return self.model
    
    def predict_image(self, image_path, show=True):
        """
        Predict emotion from image file
        """
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        return self.predict_image_array(img, show)
    
    def predict_image_array(self, image, show=True):
        """
        Predict emotion from image array
        """
        # Preprocess
        processed = preprocess_image(image)
        processed_batch = np.expand_dims(processed, axis=0)
        
        # Predict
        predictions = self.model.predict(processed_batch, verbose=0)
        print("RAW PREDICTIONS:", predictions[0])  # See all probabilities
        print("PREDICTION INDICES:", np.argsort(predictions[0])[::-1]) 
        for i, prob in enumerate(predictions[0]):
            print(f"Index {i}: {self.emotions[i]} = {prob:.4f}")
            
        emotion_idx = np.argmax(predictions[0])
        confidence = np.max(predictions[0])
        emotion_label = self.emotions[emotion_idx]
        
        # Get all predictions
        all_predictions = {
            emotion: float(predictions[0][i]) 
            for i, emotion in enumerate(self.emotions)
        }
        
        result = {
            'emotion': emotion_label,
            'confidence': confidence,
            'predictions': all_predictions,
            'emotion_idx': emotion_idx
        }
        
        if show:
            self.display_result(image, result)
        
        return result
    
    def display_result(self, image, result):
        """Display prediction results"""
        # Create display image
        display_img = image.copy()
        if len(display_img.shape) == 2:
            display_img = cv2.cvtColor(display_img, cv2.COLOR_GRAY2BGR)
        
        # Prepare text
        emotion = result['emotion']
        confidence = result['confidence']
        text = f"{emotion}: {confidence:.2f}"
        
        # Add text to image
        cv2.putText(display_img, text, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Create figure with image and bar chart
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Show image
        ax1.imshow(cv2.cvtColor(display_img, cv2.COLOR_BGR2RGB))
        ax1.set_title("Face Image")
        ax1.axis('off')
        
        # Show predictions as bar chart
        emotions = list(result['predictions'].keys())
        confidences = list(result['predictions'].values())
        
        colors = ['green' if e == emotion else 'gray' for e in emotions]
        ax2.bar(emotions, confidences, color=colors)
        ax2.set_title("Emotion Predictions")
        ax2.set_xlabel("Emotions")
        ax2.set_ylabel("Confidence")
        ax2.set_ylim([0, 1])
        
        plt.tight_layout()
        plt.show()
        
        return display_img

def predict_single_image(image_path):
    """Convenience function to predict emotion from a single image"""
    predictor = EmotionPredictor()
    return predictor.predict_image(image_path)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        predict_single_image(image_path)
    else:
        print("Usage: python predict_image.py <image_path>")