
# Training script for emotion recognition model

import os
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, 
    ModelCheckpoint, TensorBoard
)
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

from utils.config import (
    MODELS_PATH, OUTPUTS_PATH, IMG_SIZE, NUM_CLASSES,
    CNN_FILTERS, DENSE_UNITS, DROPOUT_RATE, L2_REGULARIZATION,
    LEARNING_RATE, BATCH_SIZE, EPOCHS
)
from utils.dataset_loader import DatasetLoader

class EmotionModel:
    def __init__(self):
        self.model = None
        self.history = None
        self.input_shape = (IMG_SIZE[0], IMG_SIZE[1], 1)
        self.num_classes = NUM_CLASSES
        
    def build_model(self):
        """
        Build CNN model for emotion recognition
        """
        model = keras.Sequential([
            # Input layer
            layers.Input(shape=self.input_shape),
            
            # First convolutional block
            layers.Conv2D(CNN_FILTERS[0], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.Conv2D(CNN_FILTERS[0], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(DROPOUT_RATE),
            
            # Second convolutional block
            layers.Conv2D(CNN_FILTERS[1], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.Conv2D(CNN_FILTERS[1], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(DROPOUT_RATE),
            
            # Third convolutional block
            layers.Conv2D(CNN_FILTERS[2], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.Conv2D(CNN_FILTERS[2], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(DROPOUT_RATE),
            
            # Fourth convolutional block
            layers.Conv2D(CNN_FILTERS[3], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.Conv2D(CNN_FILTERS[3], (3, 3), padding='same',
                         kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(DROPOUT_RATE),
            
            # Global average pooling
            layers.GlobalAveragePooling2D(),
            
            # Dense layers
            layers.Dense(DENSE_UNITS[0], 
                        kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.Dropout(DROPOUT_RATE),
            
            layers.Dense(DENSE_UNITS[1],
                        kernel_regularizer=regularizers.l2(L2_REGULARIZATION)),
            layers.BatchNormalization(),
            layers.Activation('relu'),
            layers.Dropout(DROPOUT_RATE),
            
            # Output layer
            layers.Dense(self.num_classes, activation='softmax')
        ])
        
        # Compile model
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        return model
    
    def train(self, X_train, y_train, X_val, y_val):
        """
        Train the model
        """
        # Build model if not built
        if self.model is None:
            self.build_model()
        
        # Callbacks
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            ),
            ModelCheckpoint(
                os.path.join(MODELS_PATH, f'best_model_{timestamp}.keras'),
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1
            ),
            TensorBoard(
                log_dir=os.path.join(OUTPUTS_PATH, 'logs', timestamp)
            )
        ]
        
        # Train model
        self.history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=EPOCHS,
            batch_size=BATCH_SIZE,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save final model
        self.model.save(os.path.join(MODELS_PATH, f'emotion_model_{timestamp}.keras'))
        
        return self.history
    
    def save_model(self, filename='emotion_model.keras'):
        """
        Save the trained model
        """
        if self.model is not None:
            model_path = os.path.join(MODELS_PATH, filename)
            self.model.save(model_path)
            print(f"Model saved to {model_path}")
    
    def load_model(self, model_path):
        """
        Load a trained model
        """
        self.model = keras.models.load_model(model_path)
        print(f"Model loaded from {model_path}")
        return self.model

def train_model():
    """
    Main training function
    """
    print("Loading dataset...")
    loader = DatasetLoader()
    X_train, y_train, X_val, y_val = loader.load_train_valid_split()
    
    print(f"Training samples: {len(X_train)}")
    print(f"Validation samples: {len(X_val)}")
    print(f"Input shape: {X_train.shape[1:]}")
    
    print("\nBuilding model...")
    model = EmotionModel()
    model.build_model()
    model.model.summary()
    
    print("\nTraining model...")
    history = model.train(X_train, y_train, X_val, y_val)
    
    # Save model
    model.save_model('emotion_model.keras')
    model.save_model('best_model.keras')
    
    print("\nTraining completed!")
    return model, history

if __name__ == "__main__":
    train_model()