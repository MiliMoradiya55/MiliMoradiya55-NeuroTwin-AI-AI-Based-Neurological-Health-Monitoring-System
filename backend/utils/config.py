# backend/utils/config.py

import os
from pathlib import Path

# ===== BASE PATHS =====
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
MODELS_DIR = BASE_DIR / 'models'
REPORTS_DIR = BASE_DIR / 'reports'
UPLOAD_DIR = BASE_DIR / 'uploads'

# ===== DATASET PATHS =====
DATASET_PATH = DATA_DIR / 'voice_data.csv'

# ===== MODEL CONFIGURATION =====
RANDOM_STATE = 42
TEST_SIZE = 0.2
CV_FOLDS = 5
TOP_FEATURES = 50

# ===== TARGET COLUMN =====
TARGET_COLUMN = 'label'

# ===== EXCLUDE COLUMNS =====
EXCLUDE_COLUMNS = []

# ===== XGBOOST PARAMETERS =====
XGB_PARAMS = {
    'n_estimators': 200,
    'max_depth': 6,
    'learning_rate': 0.1,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': RANDOM_STATE,
    'eval_metric': 'logloss',
    'use_label_encoder': False
}

# ===== FEATURE NAMES =====
VOICE_FEATURES = [
    'pitch_mean', 'pitch_std', 'pitch_min', 'pitch_max',
    'jitter', 'shimmer', 'hnr', 'voice_tremor',
    'speech_rate', 'rms_mean', 'rms_std',
    'spectral_centroid_mean', 'spectral_centroid_std'
]

# ===== CREATE DIRECTORIES =====
def create_directories():
    """Create necessary directories"""
    directories = [DATA_DIR, MODELS_DIR, REPORTS_DIR, UPLOAD_DIR]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
    print("✅ Directories created successfully!")

# Run on import
create_directories()