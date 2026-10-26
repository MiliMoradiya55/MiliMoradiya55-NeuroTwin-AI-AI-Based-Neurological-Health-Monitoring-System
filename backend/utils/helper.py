# backend/utils/helper.py

import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

def load_dataset(file_path, **kwargs):
    """
    Load dataset from CSV file with error handling
    
    Args:
        file_path: Path to CSV file
        **kwargs: Additional arguments for pd.read_csv
    
    Returns:
        DataFrame or None if file not found
    """
    try:
        if not os.path.exists(file_path):
            print(f"⚠️ File not found: {file_path}")
            print("   Generating sample data instead...")
            return generate_sample_voice_data()
        
        df = pd.read_csv(file_path, **kwargs)
        print(f"✅ Dataset loaded: {file_path}")
        print(f"   Shape: {df.shape}")
        return df
        
    except Exception as e:
        print(f"❌ Error loading dataset: {e}")
        print("   Generating sample data instead...")
        return generate_sample_voice_data()

def generate_sample_voice_data():
    """
    Generate sample voice dataset for training when real data is not available
    """
    np.random.seed(42)
    n_samples = 2000
    
    # Feature names
    feature_names = [
        'pitch_mean', 'pitch_std', 'pitch_min', 'pitch_max',
        'jitter', 'shimmer', 'hnr', 'voice_tremor',
        'speech_rate', 'rms_mean', 'rms_std',
        'spectral_centroid_mean', 'spectral_centroid_std',
        'mfcc_1_mean', 'mfcc_1_std', 'mfcc_2_mean', 'mfcc_2_std',
        'mfcc_3_mean', 'mfcc_3_std', 'mfcc_4_mean', 'mfcc_4_std',
        'mfcc_5_mean', 'mfcc_5_std', 'mfcc_6_mean', 'mfcc_6_std',
        'mfcc_7_mean', 'mfcc_7_std', 'mfcc_8_mean', 'mfcc_8_std',
        'mfcc_9_mean', 'mfcc_9_std', 'mfcc_10_mean', 'mfcc_10_std',
        'mfcc_11_mean', 'mfcc_11_std', 'mfcc_12_mean', 'mfcc_12_std',
        'mfcc_13_mean', 'mfcc_13_std'
    ]
    
    # Generate features with realistic correlations
    X = np.random.randn(n_samples, len(feature_names))
    
    # Add correlations to make it realistic
    # Healthy voices: lower jitter, shimmer, higher HNR
    for i in range(n_samples):
        # Jitter (index 4) - healthy: < 0.5
        if X[i, 4] < 0:
            X[i, 4] = X[i, 4] * 0.3
        else:
            X[i, 4] = X[i, 4] * 0.5 + 0.5
        
        # Shimmer (index 5) - healthy: < 0.5
        if X[i, 5] < 0:
            X[i, 5] = X[i, 5] * 0.3
        else:
            X[i, 5] = X[i, 5] * 0.5 + 0.5
        
        # HNR (index 6) - healthy: > 20
        X[i, 6] = X[i, 6] * 5 + 15
    
    # Generate labels (0 = healthy, 1 = needs attention)
    y = np.zeros(n_samples, dtype=int)
    
    for i in range(n_samples):
        score = 0
        # Jitter threshold
        if X[i, 4] > 0.8:
            score += 1
        # Shimmer threshold
        if X[i, 5] > 0.8:
            score += 1
        # HNR threshold
        if X[i, 6] < 18:
            score += 1
        # Pitch stability
        if X[i, 1] > 2:
            score += 1
        
        y[i] = 1 if score >= 2 else 0
    
    # Create DataFrame
    df = pd.DataFrame(X, columns=feature_names)
    df['label'] = y
    
    print(f"✅ Sample voice dataset generated: {len(df)} samples")
    print(f"   Healthy (0): {sum(y==0)}")
    print(f"   Needs Attention (1): {sum(y==1)}")
    
    return df

def clean_dataset(df):
    """
    Clean dataset by handling missing values, duplicates, etc.
    
    Args:
        df: Input DataFrame
    
    Returns:
        Cleaned DataFrame
    """
    df_clean = df.copy()
    
    # Remove duplicates
    initial_len = len(df_clean)
    df_clean = df_clean.drop_duplicates()
    if len(df_clean) < initial_len:
        print(f"   Removed {initial_len - len(df_clean)} duplicate rows")
    
    # Handle missing values
    missing = df_clean.isnull().sum()
    if missing.sum() > 0:
        print(f"   Handling {missing.sum()} missing values...")
        # Fill numeric columns with mean
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if df_clean[col].isnull().sum() > 0:
                df_clean[col] = df_clean[col].fillna(df_clean[col].mean())
        
        # Fill categorical columns with mode
        cat_cols = df_clean.select_dtypes(include=['object']).columns
        for col in cat_cols:
            if df_clean[col].isnull().sum() > 0:
                df_clean[col] = df_clean[col].fillna(df_clean[col].mode()[0])
    
    print(f"✅ Dataset cleaned: {len(df_clean)} rows")
    return df_clean

def prepare_features_target(df, target_col='label', exclude_cols=None):
    """
    Prepare features and target from DataFrame
    
    Args:
        df: Input DataFrame
        target_col: Name of target column
        exclude_cols: List of columns to exclude from features
    
    Returns:
        X: Feature DataFrame, y: Target Series
    """
    if exclude_cols is None:
        exclude_cols = []
    
    # Get all columns except target and excluded
    feature_cols = [col for col in df.columns 
                    if col not in exclude_cols and col != target_col]
    
    if not feature_cols:
        print(f"❌ No feature columns found!")
        return None, None
    
    X = df[feature_cols]
    y = df[target_col]
    
    print(f"\n📊 Features prepared:")
    print(f"   - Features: {X.shape[1]}")
    print(f"   - Target: {target_col}")
    print(f"   - Target distribution: {y.value_counts().to_dict()}")
    
    return X, y

def split_data(X, y, test_size=0.2, random_state=42):
    """
    Split data into train and test sets
    
    Args:
        X: Features
        y: Target
        test_size: Proportion for test set
        random_state: Random seed
    
    Returns:
        X_train, X_test, y_train, y_test
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    print(f"\n📊 Data split:")
    print(f"   - Training: {X_train.shape[0]} ({round((1-test_size)*100)}%)")
    print(f"   - Test: {X_test.shape[0]} ({round(test_size*100)}%)")
    
    return X_train, X_test, y_train, y_test

def scale_features(X_train, X_test):
    """
    Scale features using StandardScaler
    
    Args:
        X_train: Training features
        X_test: Test features
    
    Returns:
        X_train_scaled, X_test_scaled, scaler
    """
    from sklearn.preprocessing import StandardScaler
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train_scaled, X_test_scaled, scaler