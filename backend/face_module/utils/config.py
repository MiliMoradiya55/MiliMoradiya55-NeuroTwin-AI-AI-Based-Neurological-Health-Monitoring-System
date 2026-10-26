"""
Configuration file for Face Emotion Module
"""

import os
import numpy as np

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, 'dataset')
MODELS_PATH = os.path.join(BASE_DIR, 'models')
OUTPUTS_PATH = os.path.join(BASE_DIR, 'outputs')

# Create directories if they don't exist
os.makedirs(MODELS_PATH, exist_ok=True)
os.makedirs(os.path.join(OUTPUTS_PATH, 'predictions'), exist_ok=True)
os.makedirs(os.path.join(OUTPUTS_PATH, 'reports'), exist_ok=True)
os.makedirs(os.path.join(OUTPUTS_PATH, 'graphs'), exist_ok=True)
os.makedirs(os.path.join(OUTPUTS_PATH, 'logs'), exist_ok=True)

# Model parameters
IMG_SIZE = (48, 48)
BATCH_SIZE = 64
EPOCHS = 30
LEARNING_RATE = 0.001
DROPOUT_RATE = 0.3
L2_REGULARIZATION = 0.001

# Training parameters
VALIDATION_SPLIT = 0.2
EARLY_STOPPING_PATIENCE = 10
REDUCE_LR_PATIENCE = 5
REDUCE_LR_FACTOR = 0.5

# Emotion labels
EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
NUM_CLASSES = len(EMOTIONS)

# Model architecture
CNN_FILTERS = [32, 64, 128, 256]
DENSE_UNITS = [256, 128]

# Data augmentation parameters
ROTATION_RANGE = 20
WIDTH_SHIFT_RANGE = 0.2
HEIGHT_SHIFT_RANGE = 0.2
HORIZONTAL_FLIP = True
ZOOM_RANGE = 0.2

# Inference parameters
CONFIDENCE_THRESHOLD = 0.5

# MediaPipe parameters
MIN_DETECTION_CONFIDENCE = 0.5
MIN_TRACKING_CONFIDENCE = 0.5
