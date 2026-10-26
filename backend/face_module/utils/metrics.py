"""
Metrics calculation utilities
"""

import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from .config import EMOTIONS

def calculate_metrics(y_true, y_pred, average='weighted'):
    """
    Calculate classification metrics
    """
    metrics = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision': precision_score(y_true, y_pred, average=average),
        'recall': recall_score(y_true, y_pred, average=average),
        'f1': f1_score(y_true, y_pred, average=average)
    }
    return metrics

def calculate_class_metrics(y_true, y_pred):
    """
    Calculate per-class metrics
    """
    metrics = {}
    for i, emotion in enumerate(EMOTIONS):
        y_true_class = (y_true == i)
        y_pred_class = (y_pred == i)
        
        # Calculate metrics for this class
        if np.sum(y_true_class) > 0:
            precision = np.sum((y_true_class) & (y_pred_class)) / np.sum(y_pred_class) if np.sum(y_pred_class) > 0 else 0
            recall = np.sum((y_true_class) & (y_pred_class)) / np.sum(y_true_class)
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
            
            metrics[emotion] = {
                'precision': precision,
                'recall': recall,
                'f1': f1,
                'support': np.sum(y_true_class)
            }
    
    return metrics

def calculate_confidence_metrics(y_pred_probs, y_true):
    """
    Calculate confidence-related metrics
    """
    confidences = np.max(y_pred_probs, axis=1)
    predictions = np.argmax(y_pred_probs, axis=1)
    correct = (predictions == y_true)
    
    # Confidence for correct and incorrect predictions
    correct_confidences = confidences[correct]
    incorrect_confidences = confidences[~correct]
    
    metrics = {
        'mean_confidence': np.mean(confidences),
        'mean_correct_confidence': np.mean(correct_confidences) if len(correct_confidences) > 0 else 0,
        'mean_incorrect_confidence': np.mean(incorrect_confidences) if len(incorrect_confidences) > 0 else 0,
        'confidence_std': np.std(confidences)
    }
    
    return metrics
