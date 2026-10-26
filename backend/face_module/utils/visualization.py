"""
Visualization utilities for emotion detection
"""

import cv2
import numpy as np
import matplotlib.pyplot as plt
from .config import EMOTIONS

def draw_emotion_bar(emotions, confidences, title="Emotion Predictions"):
    """
    Draw bar chart of emotion predictions
    """
    plt.figure(figsize=(10, 6))
    colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink']
    bars = plt.bar(emotions, confidences, color=colors)
    
    # Add value labels on bars
    for bar, conf in zip(bars, confidences):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                f'{conf:.2f}', ha='center', va='bottom')
    
    plt.title(title)
    plt.xlabel('Emotions')
    plt.ylabel('Confidence')
    plt.ylim([0, 1.1])
    plt.grid(True, alpha=0.3)
    return plt

def draw_emotion_on_face(frame, bbox, emotion, confidence, color=(0, 255, 0)):
    """
    Draw emotion on face in image frame
    """
    x, y, w, h = bbox
    
    # Draw rectangle
    cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
    
    # Draw label
    label = f"{emotion}: {confidence:.2f}"
    label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
    
    cv2.rectangle(frame, (x, y-25), (x+label_size[0], y), color, -1)
    cv2.putText(frame, label, (x, y-5), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    return frame

def visualize_predictions(image, predictions, top_k=3):
    """
    Visualize top-k predictions on image
    """
    display_img = image.copy()
    
    # Get top-k predictions
    sorted_preds = sorted(predictions.items(), key=lambda x: x[1], reverse=True)[:top_k]
    
    # Display predictions
    y_pos = 30
    for i, (emotion, conf) in enumerate(sorted_preds):
        text = f"{emotion}: {conf:.2f}"
        cv2.putText(display_img, text, (10, y_pos + i*30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    return display_img

def plot_training_history(history, save_path=None):
    """
    Plot training and validation history
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Accuracy
    ax1.plot(history.history['accuracy'], label='Training Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True)
    
    # Loss
    ax2.plot(history.history['loss'], label='Training Loss')
    ax2.plot(history.history['val_loss'], label='Validation Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path)
    
    plt.show()