# backend/training/train_with_clinical_features.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import xgboost as xgb
import pickle
import matplotlib.pyplot as plt
import seaborn as sns
import os

def train_with_clinical_features():
    """Train model using properly generated clinical dataset"""
    
    print("=" * 60)
    print("   🧠 TRAINING WITH CLINICAL FEATURES")
    print("=" * 60)
    
    # ===== CHECK IF DATASET EXISTS =====
    if not os.path.exists('tremor_dataset.csv'):
        print("\n❌ tremor_dataset.csv not found!")
        print("📌 Run: python create_proper_clinical_dataset.py")
        return None
    
    # Load data
    df = pd.read_csv('tremor_dataset.csv')
    print(f"\n📂 Dataset loaded: {len(df)} samples")
    
    # ===== DISPLAY DATASET STATISTICS =====
    print(f"\n📊 Label Distribution:")
    print(df['label'].value_counts())
    
    print(f"\n📊 Feature Statistics by Class:")
    for label in ['Normal', 'Mild', 'Severe']:
        print(f"\n   {label}:")
        class_data = df[df['label'] == label]
        print(f"      tremor_frequency: {class_data['tremor_frequency'].mean():.2f} ± {class_data['tremor_frequency'].std():.2f} Hz")
        print(f"      tremor_amplitude: {class_data['tremor_amplitude'].mean():.2f} ± {class_data['tremor_amplitude'].std():.2f} mm")
        print(f"      hand_stability: {class_data['hand_stability'].mean():.1f} ± {class_data['hand_stability'].std():.1f}%")
    
    # ===== CLINICAL FEATURES =====
    clinical_features = [
        'tremor_frequency',
        'tremor_amplitude',
        'hand_stability',
        'jerk',
        'variance',
        'range_movement',
    ]
    
    secondary_features = [
        'wrist_stability',
        'wrist_movement',
    ]
    
    selected_features = clinical_features + secondary_features
    
    print(f"\n📋 Using {len(selected_features)} clinically relevant features:")
    for f in selected_features:
        print(f"   ✓ {f}")
    
    # Prepare data
    X = df[selected_features]
    y = df['label']
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print(f"\n✅ Training samples: {len(X_train)}")
    print(f"✅ Test samples: {len(X_test)}")
    
    # ===== TRAIN XGBOOST =====
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.5,
        reg_lambda=1.0,
        random_state=42,
        eval_metric='mlogloss'
    )
    
    model.fit(X_train_scaled, y_train)
    
    # ===== EVALUATE =====
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n📈 Test Accuracy: {accuracy:.3f}")
    
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    
    # ===== CONFUSION MATRIX =====
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=label_encoder.classes_,
                yticklabels=label_encoder.classes_)
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.tight_layout()
    plt.savefig('confusion_matrix_tremor.png')
    print("\n✅ Confusion matrix saved to: confusion_matrix_tremor.png")
    
    # ===== CROSS-VALIDATION =====
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
    print(f"\n📊 Cross-validation scores: {cv_scores}")
    print(f"Mean CV score: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
    
    # ===== FEATURE IMPORTANCE =====
    feature_importance = pd.DataFrame({
        'feature': selected_features,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n📊 Feature Importance:")
    print(feature_importance)
    
    # Plot feature importance
    plt.figure(figsize=(10, 6))
    plt.barh(feature_importance['feature'], feature_importance['importance'])
    plt.xlabel('Importance')
    plt.title('XGBoost Feature Importance - Tremor Clinical Features')
    plt.tight_layout()
    plt.savefig('feature_importance_tremor.png')
    print("✅ Feature importance plot saved to: feature_importance_tremor.png")
    
    # ===== SAVE MODEL =====
    os.makedirs('models', exist_ok=True)
    model_data = {
        'model': model,
        'scaler': scaler,
        'label_encoder': label_encoder,
        'feature_importance': feature_importance,
        'accuracy': accuracy,
        'cv_scores': cv_scores,
        'feature_names': selected_features
    }
    
    with open('models/xgboost_tremor_model_clinical.pkl', 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"\n✅ Model saved to: models/xgboost_tremor_model_clinical.pkl")
    print(f"📊 Model accuracy: {accuracy:.3f} ({accuracy*100:.1f}%)")
    
    return model_data

def test_model():
    """Test the trained model"""
    try:
        with open('models/xgboost_tremor_model_clinical.pkl', 'rb') as f:
            model_data = pickle.load(f)
        
        print("\n" + "=" * 60)
        print("   🧪 MODEL TEST")
        print("=" * 60)
        
        print(f"\n✅ Model loaded successfully!")
        print(f"📊 Accuracy: {model_data['accuracy']:.3f}")
        print(f"📊 Features: {len(model_data['feature_names'])}")
        
        # Test with sample inputs
        print("\n📋 Testing with sample inputs:")
        
        test_cases = [
            {'tremor_frequency': 2.0, 'tremor_amplitude': 0.5, 'hand_stability': 92, 'jerk': 0.02, 'variance': 0.005, 'range_movement': 0.5, 'wrist_stability': 90, 'wrist_movement': 2.0},
            {'tremor_frequency': 4.0, 'tremor_amplitude': 2.5, 'hand_stability': 75, 'jerk': 0.08, 'variance': 0.04, 'range_movement': 2.5, 'wrist_stability': 70, 'wrist_movement': 10.0},
            {'tremor_frequency': 6.5, 'tremor_amplitude': 5.0, 'hand_stability': 45, 'jerk': 0.25, 'variance': 0.12, 'range_movement': 5.0, 'wrist_stability': 40, 'wrist_movement': 20.0},
        ]
        
        scaler = model_data['scaler']
        label_encoder = model_data['label_encoder']
        model = model_data['model']
        feature_names = model_data['feature_names']
        
        for i, test_case in enumerate(test_cases):
            features = [test_case.get(name, 0) for name in feature_names]
            X = np.array(features).reshape(1, -1)
            X_scaled = scaler.transform(X)
            pred = model.predict(X_scaled)[0]
            label = label_encoder.inverse_transform([pred])[0]
            print(f"\n   Test {i+1}:")
            for name in feature_names:
                print(f"      {name}: {test_case.get(name, 0):.2f}")
            print(f"      → Predicted: {label}")
            
    except Exception as e:
        print(f"❌ Error testing model: {e}")

if __name__ == "__main__":
    train_with_clinical_features()
    test_model()