
# Preprocessing functions for face emotion detection


import cv2
import numpy as np
from .config import IMG_SIZE

def preprocess_image(image, target_size=IMG_SIZE):
    """
    Preprocess image for emotion detection
    """
    # Resize image
    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Resize to target size
    image = cv2.resize(image, target_size)
    
    # Apply histogram equalization for better contrast
    image = cv2.equalizeHist(image)
    
    # Normalize to [0, 1]
    image = image / 255.0
    
    # Add channel dimension
    image = np.expand_dims(image, axis=-1)
    
    return image

def preprocess_face(face):
    """
    Preprocess detected face region
    """
    # Convert to grayscale if needed
    if len(face.shape) == 3:
        face = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    
    # Resize
    face = cv2.resize(face, IMG_SIZE)
    
    # Equalize histogram
    face = cv2.equalizeHist(face)
    
    # Normalize
    face = face / 255.0
    
    # Add batch and channel dimensions
    face = np.expand_dims(face, axis=0)
    face = np.expand_dims(face, axis=-1)
    
    return face