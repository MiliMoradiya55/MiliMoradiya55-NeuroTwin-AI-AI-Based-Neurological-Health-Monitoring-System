"""
Model evaluation for voice module
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, classification_report
)
import joblib
import sys
import os
import warnings
warnings.filterwarnings('ignore')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import *
from preprocessing.preprocess import preprocess_data

def evaluate_model(model, X_test, y_test, model_name="Model"):
    """Comprehensive model evaluation"""
    print(f"\n{'='*80}")
    print(f"📊 EVALUATING {model_name}")
    print(f"{'='*80}")
    
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"\n📈 Performance Metrics:")
    print(f"   Accuracy:  {accuracy:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall:    {recall:.4f}")
    print(f"   F1-Score:  {f1:.4f}")
    print(f"\n📋 Classification Report:\n{classification_report(y_test, y_pred)}")
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Healthy', 'Parkinson\'s'],
                yticklabels=['Healthy', 'Parkinson\'s'])
    plt.title(f'Confusion Matrix - {model_name}')
    plt.tight_layout()
    os.makedirs(REPORTS_DIR, exist_ok=True)
    plt.savefig(os.path.join(REPORTS_DIR, f'confusion_matrix.png'), dpi=150, bbox_inches='tight')
    plt.close()
    
    # ROC Curve
    if y_pred_proba is not None:
        fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
        roc_auc = auc(fpr, tpr)
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {roc_auc:.3f})')
        plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'ROC Curve - {model_name}')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, f'roc_curve.png'), dpi=150, bbox_inches='tight')
        plt.close()
    
    return {'accuracy': accuracy, 'precision': precision, 'recall': recall, 'f1_score': f1}

def main():
    """Evaluate all models"""
    print("=" * 80)
    print("🔍 MODEL EVALUATION")
    print("=" * 80)
    
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_data()
    
    if X_train is None:
        return
    
    # Load model
    model_path = os.path.join(MODELS_DIR, 'voice_model.pkl')
    if not os.path.exists(model_path):
        print("❌ Model not found! Please train first.")
        return
    
    model = joblib.load(model_path)
    results = evaluate_model(model, X_test, y_test, "voice_model")
    
    print(f"\n📊 Final Results:")
    for key, value in results.items():
        print(f"   {key}: {value:.4f}")

if __name__ == "__main__":
    main()