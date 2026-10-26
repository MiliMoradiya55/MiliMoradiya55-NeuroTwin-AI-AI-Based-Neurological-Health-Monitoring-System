"""
Hyperparameter tuning for XGBoost
"""

import numpy as np
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from xgboost import XGBClassifier
import joblib
import sys
import os
import warnings
warnings.filterwarnings('ignore')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import *
from preprocessing.preprocess import preprocess_data

def tune_xgboost(X_train, y_train):
    """
    Tune XGBoost hyperparameters
    """
    print("\n" + "=" * 80)
    print("🔧 TUNING XGBOOST")
    print("=" * 80)
    
    param_grid = {
        'n_estimators': [100, 200, 300],
        'max_depth': [4, 6, 8, 10],
        'learning_rate': [0.01, 0.05, 0.1, 0.2],
        'subsample': [0.6, 0.8, 1.0],
        'colsample_bytree': [0.6, 0.8, 1.0],
        'min_child_weight': [1, 3, 5],
        'gamma': [0, 0.1, 0.2]
    }
    
    xgb = XGBClassifier(
        random_state=RANDOM_STATE, 
        use_label_encoder=False, 
        eval_metric='logloss'
    )
    
    print("🔄 Running Randomized Search...")
    random_search = RandomizedSearchCV(
        xgb, param_grid, n_iter=30, cv=CV_FOLDS,
        scoring='accuracy', n_jobs=-1, random_state=RANDOM_STATE, verbose=1
    )
    random_search.fit(X_train, y_train)
    
    print(f"\n✅ Best parameters: {random_search.best_params_}")
    print(f"   Best score: {random_search.best_score_:.4f}")
    
    return random_search.best_estimator_, random_search.best_params_

def main():
    """
    Main tuning pipeline
    """
    # Load and prepare data
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_data()
    
    if X_train is None:
        return
    
    # Tune XGBoost
    best_model, best_params = tune_xgboost(X_train, y_train)
    
    # Save tuned model
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(best_model, os.path.join(MODELS_DIR, 'xgboost_tuned.pkl'))
    
    print("\n✅ Tuned model saved!")
    
    return best_model, best_params

if __name__ == "__main__":
    main()