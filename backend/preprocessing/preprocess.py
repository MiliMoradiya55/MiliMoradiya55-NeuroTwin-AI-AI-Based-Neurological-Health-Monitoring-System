# backend/preprocessing/preprocess.py

"""
Data preprocessing for voice module - FIXED
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import sys
import os
import warnings
import joblib

warnings.filterwarnings('ignore')

# ===== FIX: Add parent directory to Python path =====
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ===== NOW IMPORT WORKS =====
from utils.config import DATA_DIR, MODELS_DIR, RANDOM_STATE, TEST_SIZE

def generate_sample_data():
    """Generate synthetic voice data for training"""
    np.random.seed(RANDOM_STATE)
    n_samples = 2000
    
    feature_names = [
        'pitch_mean', 'pitch_std', 'pitch_min', 'pitch_max',
        'jitter', 'shimmer', 'hnr', 'voice_tremor',
        'speech_rate', 'rms_mean', 'rms_std',
        'spectral_centroid_mean', 'spectral_centroid_std',
        'mfcc_1_mean', 'mfcc_1_std', 'mfcc_2_mean', 'mfcc_2_std',
        'mfcc_3_mean', 'mfcc_3_std', 'mfcc_4_mean', 'mfcc_4_std'
    ]
    
    X = np.random.randn(n_samples, len(feature_names))
    
    # Add realistic patterns
    for i in range(n_samples):
        # Jitter (index 4)
        if X[i, 4] < 0:
            X[i, 4] = X[i, 4] * 0.3
        else:
            X[i, 4] = X[i, 4] * 0.5 + 0.5
        
        # Shimmer (index 5)
        if X[i, 5] < 0:
            X[i, 5] = X[i, 5] * 0.3
        else:
            X[i, 5] = X[i, 5] * 0.5 + 0.5
        
        # HNR (index 6)
        X[i, 6] = X[i, 6] * 5 + 15
    
    # Generate labels
    y = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        score = 0
        if X[i, 4] > 0.8: score += 1
        if X[i, 5] > 0.8: score += 1
        if X[i, 6] < 18: score += 1
        if X[i, 1] > 2: score += 1
        y[i] = 1 if score >= 2 else 0
    
    df = pd.DataFrame(X, columns=feature_names)
    df['label'] = y
    
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(os.path.join(DATA_DIR, 'voice_data.csv'), index=False)
    print(f"✅ Sample dataset created: {len(df)} samples")
    print(f"   Healthy (0): {sum(y==0)}")
    print(f"   Needs Attention (1): {sum(y==1)}")
    
    return X, y, feature_names

def preprocess_data():
    """Main preprocessing function"""
    print("=" * 80)
    print("🔊 VOICE MODULE - DATA PREPROCESSING")
    print("=" * 80)
    
    data_path = os.path.join(DATA_DIR, 'voice_data.csv')
    
    # Load or generate data
    if os.path.exists(data_path):
        print(f"📂 Loading dataset from {data_path}")
        df = pd.read_csv(data_path)
        print(f"   Shape: {df.shape}")
        X = df.drop('label', axis=1).values
        y = df['label'].values
        feature_names = df.drop('label', axis=1).columns.tolist()
        print(f"   Samples: {len(df)}")
        print(f"   Healthy: {sum(y==0)}")
        print(f"   Needs Attention: {sum(y==1)}")
    else:
        print("⚠️ Dataset not found. Generating sample data...")
        X, y, feature_names = generate_sample_data()
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save scaler and feature names
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))
    joblib.dump(feature_names, os.path.join(MODELS_DIR, 'feature_names.pkl'))
    
    print(f"\n✅ Preprocessing complete!")
    print(f"   - Training samples: {X_train_scaled.shape[0]}")
    print(f"   - Test samples: {X_test_scaled.shape[0]}")
    print(f"   - Features: {X_train_scaled.shape[1]}")
    
    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names

if __name__ == "__main__":
    preprocess_data()