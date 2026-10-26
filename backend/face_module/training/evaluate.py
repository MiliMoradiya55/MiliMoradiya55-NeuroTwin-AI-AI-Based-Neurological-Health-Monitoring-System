"""
Evaluation script for emotion recognition model
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import tensorflow as tf

from utils.config import MODELS_PATH, OUTPUTS_PATH, EMOTIONS
from utils.dataset_loader import DatasetLoader

class ModelEvaluator:
    def __init__(self, model_path=None):
        self.model = None
        self.model_path = model_path
        self.emotions = EMOTIONS
        
    def load_model(self, model_path=None):
        """Load the trained model"""
        if model_path is None:
            model_path = os.path.join(MODELS_PATH, 'emotion_model.keras')
        
        self.model = tf.keras.models.load_model(model_path)
        print(f"Model loaded from {model_path}")
        return self.model
    
    def evaluate(self, X_test, y_test):
        """Evaluate the model on test data"""
        if self.model is None:
            self.load_model()
        
        # Predict
        y_pred_probs = self.model.predict(X_test)
        y_pred = np.argmax(y_pred_probs, axis=1)
        y_true = np.argmax(y_test, axis=1)
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        report = classification_report(y_true, y_pred, target_names=self.emotions)
        
        print(f"\nTest Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(report)
        
        return y_pred, y_true, y_pred_probs
    
    def plot_confusion_matrix(self, y_true, y_pred, save=True):
        """Plot confusion matrix"""
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=self.emotions, 
                    yticklabels=self.emotions)
        plt.title('Confusion Matrix')
        plt.xlabel('Predicted')
        plt.ylabel('True')
        plt.tight_layout()
        
        if save:
            save_path = os.path.join(OUTPUTS_PATH, 'graphs', 'confusion_matrix.png')
            plt.savefig(save_path)
            print(f"Confusion matrix saved to {save_path}")
        
        plt.show()
        return cm
    
    def plot_training_history(self, history, save=True):
        """Plot training history"""
        if history is None:
            print("No training history provided")
            return
        
        fig, axes = plt.subplots(1, 2, figsize=(12, 4))
        
        # Accuracy plot
        axes[0].plot(history.history['accuracy'], label='Training Accuracy')
        axes[0].plot(history.history['val_accuracy'], label='Validation Accuracy')
        axes[0].set_title('Model Accuracy')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Accuracy')
        axes[0].legend()
        axes[0].grid(True)
        
        # Loss plot
        axes[1].plot(history.history['loss'], label='Training Loss')
        axes[1].plot(history.history['val_loss'], label='Validation Loss')
        axes[1].set_title('Model Loss')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Loss')
        axes[1].legend()
        axes[1].grid(True)
        
        plt.tight_layout()
        
        if save:
            save_path = os.path.join(OUTPUTS_PATH, 'graphs', 'training_history.png')
            plt.savefig(save_path)
            print(f"Training history plot saved to {save_path}")
        
        plt.show()
    
    def evaluate_facial_movement(self, features):
        """Evaluate facial movement for NeuroTwin AI integration"""
        # This is a placeholder for future integration
        # Will analyze facial expressions and movements
        analysis = {
            'smile_intensity': 0.0,
            'facial_symmetry': 0.0,
            'blink_frequency': 0.0,
            'eye_movement': 0.0,
            'facial_muscle_activity': 0.0
        }
        
        # Add actual implementation when integrated with face tracking
        return analysis

def evaluate_model():
    """Main evaluation function"""
    print("Loading dataset...")
    loader = DatasetLoader()
    _, _, X_test, y_test = loader.load_dataset()
    
    print(f"Test samples: {len(X_test)}")
    
    print("\nEvaluating model...")
    evaluator = ModelEvaluator()
    evaluator.load_model()
    
    y_pred, y_true, y_pred_probs = evaluator.evaluate(X_test, y_test)
    
    # Plot confusion matrix
    evaluator.plot_confusion_matrix(y_true, y_pred)
    
    # Analyze errors
    errors = np.where(y_pred != y_true)[0]
    print(f"\nNumber of misclassifications: {len(errors)}")
    
    # Print sample predictions
    print("\nSample predictions:")
    for i in range(min(5, len(y_pred))):
        true_label = EMOTIONS[y_true[i]]
        pred_label = EMOTIONS[y_pred[i]]
        confidence = np.max(y_pred_probs[i])
        print(f"Sample {i}: True={true_label}, Pred={pred_label}, Confidence={confidence:.4f}")
    
    return evaluator, y_pred, y_true

if __name__ == "__main__":
    evaluate_model()