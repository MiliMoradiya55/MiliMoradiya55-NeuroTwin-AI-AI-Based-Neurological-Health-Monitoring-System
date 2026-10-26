
# Dataset loader for FER2013 emotion recognition


import os
import numpy as np
import cv2
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from .config import DATASET_PATH, IMG_SIZE, EMOTIONS, VALIDATION_SPLIT
from .preprocessing import preprocess_image

class DatasetLoader:
    def __init__(self, dataset_path=DATASET_PATH, img_size=IMG_SIZE):
        self.dataset_path = dataset_path
        self.img_size = img_size
        self.emotions = EMOTIONS
        self.num_classes = len(EMOTIONS)
        
    def load_dataset(self):
        """Load the entire dataset from train and test folders"""
        X_train, y_train = self._load_data_from_folder('train')
        X_test, y_test = self._load_data_from_folder('test')
        
        # Normalize and preprocess
        X_train = np.array(X_train) / 255.0
        X_test = np.array(X_test) / 255.0
        
        # One-hot encode labels
        y_train = to_categorical(y_train, self.num_classes)
        y_test = to_categorical(y_test, self.num_classes)
        
        return X_train, y_train, X_test, y_test
    
    def _load_data_from_folder(self, folder):
        """Load data from a specific folder (train or test)"""
        images = []
        labels = []
        
        folder_path = os.path.join(self.dataset_path, folder)
        
        for emotion_idx, emotion in enumerate(self.emotions):
            emotion_path = os.path.join(folder_path, emotion)
            if not os.path.exists(emotion_path):
                continue
                
            for img_name in os.listdir(emotion_path):
                img_path = os.path.join(emotion_path, img_name)
                try:
                    # Load and preprocess image
                    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
                    if img is not None:
                        img = preprocess_image(img, self.img_size)
                        images.append(img)
                        labels.append(emotion_idx)
                except Exception as e:
                    print(f"Error loading image {img_path}: {e}")
                    continue
        
        return images, labels
    
    def load_train_valid_split(self):
        """Load training data with validation split"""
        X_train, y_train, _, _ = self.load_dataset()
        
        # Split training data into train and validation
        X_train, X_val, y_train, y_val = train_test_split(
            X_train, y_train, 
            test_size=VALIDATION_SPLIT, 
            random_state=42,
            stratify=y_train
        )
        
        return X_train, y_train, X_val, y_val
    
    def get_data_generators(self, batch_size=32):
        """Get data generators with augmentation"""
        from tensorflow.keras.preprocessing.image import ImageDataGenerator
        
        # Training data generator with augmentation
        train_datagen = ImageDataGenerator(
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            zoom_range=0.2,
            fill_mode='nearest'
        )
        
        # Validation/Test data generator (no augmentation)
        test_datagen = ImageDataGenerator()
        
        # Load data
        X_train, y_train, X_val, y_val = self.load_train_valid_split()
        
        # Create generators
        train_generator = train_datagen.flow(
            X_train, y_train,
            batch_size=batch_size,
            shuffle=True
        )
        
        val_generator = test_datagen.flow(
            X_val, y_val,
            batch_size=batch_size,
            shuffle=False
        )
        
        return train_generator, val_generator, len(X_train), len(X_val)