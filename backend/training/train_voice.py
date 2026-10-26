# backend/training/train_voice.py

"""
Model training for voice module - XGBoost
"""

import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report
import joblib
import sys
import os
import warnings
warnings.filterwarnings('ignore')

# ===== FIX: Add parent directory to Python path =====
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ===== NOW IMPORT WORKS =====
from utils.config import MODELS_DIR, RANDOM_STATE, XGB_PARAMS
from preprocessing.preprocess import preprocess_data

def train_xgboost(X_train, y_train, params=None):
    """Train XGBoost classifier"""
    if params is None:
        params = XGB_PARAMS.copy()
    model = XGBClassifier(**params)
    model.fit(X_train, y_train)
    return model

def train_random_forest(X_train, y_train):
    """Train Random Forest classifier"""
    model = RandomForestClassifier(
        n_estimators=200, max_depth=12, 
        random_state=RANDOM_STATE, n_jobs=-1
    )
    model.fit(X_train, y_train)
    return model

def train_svm(X_train, y_train):
    """Train SVM classifier"""
    model = SVC(kernel='rbf', C=1.0, gamma='scale', 
                random_state=RANDOM_STATE, probability=True)
    model.fit(X_train, y_train)
    return model

def train_all_models(X_train, X_test, y_train, y_test):
    """Train all models and compare performance"""
    print("\n" + "=" * 80)
    print("🤖 MODEL TRAINING")
    print("=" * 80)
    
    models = {
        'XGBoost': train_xgboost(X_train, y_train),
        'Random Forest': train_random_forest(X_train, y_train),
        'SVM': train_svm(X_train, y_train)
    }
    
    results = {}
    for name, model in models.items():
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        results[name] = {
            'model': model,
            'accuracy': accuracy,
            'predictions': y_pred
        }
        print(f"\n📊 {name}:")
        print(f"   Accuracy: {accuracy:.4f}")
        print(f"   Classification Report:\n{classification_report(y_test, y_pred)}")
    
    best_name = max(results, key=lambda x: results[x]['accuracy'])
    best_model = results[best_name]['model']
    print(f"\n🏆 Best Model: {best_name} (Accuracy: {results[best_name]['accuracy']:.4f})")
    
    return best_model, results

def main():
    """Main training pipeline"""
    print("=" * 80)
    print("🎯 VOICE MODEL TRAINING PIPELINE")
    print("=" * 80)
    
    # Preprocess data
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_data()
    
    if X_train is None:
        print("❌ Failed to preprocess data")
        return
    
    # Train models
    best_model, results = train_all_models(X_train, X_test, y_train, y_test)
    
    # Save best model
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(best_model, os.path.join(MODELS_DIR, 'voice_model.pkl'))
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))
    joblib.dump(feature_names, os.path.join(MODELS_DIR, 'feature_names.pkl'))
    
    print(f"\n✅ Training complete!")
    print(f"📁 Models saved to: {MODELS_DIR}")
    print(f"   - voice_model.pkl")
    print(f"   - scaler.pkl")
    print(f"   - feature_names.pkl")

if __name__ == "__main__":
    main()