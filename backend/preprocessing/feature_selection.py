"""
Feature selection using importance and correlation
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.feature_selection import SelectKBest, mutual_info_classif
from sklearn.ensemble import RandomForestClassifier
import sys
import os
import warnings
warnings.filterwarnings('ignore')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.config import *
from utils.helper import load_dataset, clean_dataset, prepare_features_target
from preprocessing.preprocess import preprocess_data

def analyze_feature_importance(X, y, feature_names):
    """Analyze feature importance using Random Forest"""
    print("\n" + "=" * 80)
    print("🔍 FEATURE IMPORTANCE ANALYSIS")
    print("=" * 80)
    
    print("🔄 Training Random Forest for feature importance...")
    rf = RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1)
    rf.fit(X, y)
    
    importance = rf.feature_importances_
    
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': importance
    }).sort_values('importance', ascending=False)
    
    print(f"\n📊 Top 20 Important Features:")
    print("=" * 80)
    print(f"{'Rank':<6} {'Feature Name':<50} {'Importance':<12}")
    print("-" * 80)
    for i, row in feature_importance.head(20).iterrows():
        rank = list(feature_importance.head(20).index).index(i) + 1
        name = row['feature'][:49] if len(row['feature']) > 49 else row['feature']
        print(f"{rank:<6} {name:<50} {row['importance']:.6f}")
    
    # Plot
    plt.figure(figsize=(14, 12))
    top_n = min(30, len(feature_importance))
    top_features = feature_importance.head(top_n)
    
    plt.barh(top_features['feature'], top_features['importance'])
    plt.xlabel('Importance Score', fontsize=12)
    plt.title(f'Top {top_n} Voice Features Importance', fontsize=14, fontweight='bold')
    plt.tight_layout()
    
    os.makedirs(REPORTS_DIR, exist_ok=True)
    plt.savefig(os.path.join(REPORTS_DIR, 'feature_importance.png'), dpi=150, bbox_inches='tight')
    plt.close()
    
    feature_importance.to_csv(os.path.join(REPORTS_DIR, 'feature_importance.csv'), index=False)
    print(f"\n✅ Feature importance saved to {REPORTS_DIR}")
    
    return feature_importance

def select_best_features(X, y, feature_names, k=50):
    """Select top K features using Mutual Information"""
    print("\n" + "=" * 80)
    print("🎯 FEATURE SELECTION")
    print("=" * 80)
    
    print(f"🔄 Selecting top {k} features using Mutual Information...")
    selector = SelectKBest(mutual_info_classif, k=min(k, X.shape[1]))
    selector.fit(X, y)
    
    selected_indices = selector.get_support(indices=True)
    selected_features = [feature_names[i] for i in selected_indices]
    scores = selector.scores_
    selected_scores = [scores[i] for i in selected_indices]
    
    selected_df = pd.DataFrame({
        'feature': selected_features,
        'score': selected_scores
    }).sort_values('score', ascending=False)
    
    print(f"\n✅ Top 30 Selected Features:")
    print("=" * 80)
    print(f"{'Rank':<6} {'Feature Name':<50} {'Score':<12}")
    print("-" * 80)
    for i, row in selected_df.head(30).iterrows():
        rank = list(selected_df.head(30).index).index(i) + 1
        name = row['feature'][:49] if len(row['feature']) > 49 else row['feature']
        print(f"{rank:<6} {name:<50} {row['score']:.6f}")
    
    # Plot
    plt.figure(figsize=(14, 12))
    top_plot = min(30, len(selected_df))
    plt.barh(selected_df['feature'].head(top_plot), selected_df['score'].head(top_plot))
    plt.xlabel('Mutual Information Score', fontsize=12)
    plt.title(f'Top {top_plot} Selected Features', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'selected_features.png'), dpi=150, bbox_inches='tight')
    plt.close()
    
    selected_df.to_csv(os.path.join(REPORTS_DIR, 'selected_features.csv'), index=False)
    
    return selected_features, selector

def main():
    """Main feature selection pipeline"""
    print("=" * 80)
    print("🔊 VOICE MODULE - FEATURE SELECTION")
    print("=" * 80)
    
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_data()
    
    if X_train is None:
        print("❌ Preprocessing failed!")
        return
    
    print(f"\n📊 Total features: {X_train.shape[1]}")
    
    feature_importance = analyze_feature_importance(X_train, y_train, feature_names)
    selected_features, selector = select_best_features(X_train, y_train, feature_names, TOP_FEATURES)
    
    # Save selected features
    import joblib
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(selected_features, os.path.join(MODELS_DIR, 'selected_features.pkl'))
    
    print(f"\n✅ Selected features saved to {MODELS_DIR}")
    print(f"   Total features: {len(feature_importance)}")
    print(f"   Selected features: {len(selected_features)}")
    
    return selected_features

if __name__ == "__main__":
    main()