# backend/inspect_models.py

"""
Inspect all 5 trained models to see:
- Input shape (how many features)
- Output shape (regression vs classification)
- Model type (which SHAP explainer to use)
- Feature names (if available)
"""

import os
import pickle
import joblib

MODELS_DIR = "models"


def inspect_pickle_model(name: str, path: str):
    """Inspect a pickled sklearn/xgboost model"""
    print(f"\n{'='*70}")
    print(f"📦 Model: {name}")
    print(f"   File: {path}")
    print(f"{'='*70}")

    try:
        model = joblib.load(path)
        print(f"   Type: {type(model).__name__}")

        # Input features
        if hasattr(model, "n_features_in_"):
            print(f"   ⭐ n_features_in_: {model.n_features_in_}")
        elif hasattr(model, "feature_names_in_"):
            print(f"   ⭐ feature_names_in_: {list(model.feature_names_in_)}")
        else:
            print(f"   ⚠️ Cannot detect input feature count")

        # Feature names (sklearn)
        if hasattr(model, "feature_names_in_"):
            print(f"   Feature names: {list(model.feature_names_in_)[:10]}...")

        # Tree-specific info
        if hasattr(model, "get_booster"):
            booster = model.get_booster()
            print(f"   Booster feature names: {booster.feature_names}")
            print(f"   Num features: {booster.num_features()}")

        # For sklearn classifiers
        if hasattr(model, "classes_"):
            print(f"   Classes: {model.classes_}")

        # For sklearn regressors
        if hasattr(model, "n_outputs_"):
            print(f"   n_outputs_: {model.n_outputs_}")

    except Exception as e:
        print(f"   ❌ Error: {e}")


def inspect_keras_model(name: str, path: str):
    """Inspect a Keras model"""
    print(f"\n{'='*70}")
    print(f"🧠 Model: {name}")
    print(f"   File: {path}")
    print(f"{'='*70}")

    try:
        from tensorflow import keras
        model = keras.models.load_model(path, compile=False)

        print(f"   Type: Keras Model")
        print(f"   Input shape:  {model.input_shape}")
        print(f"   Output shape: {model.output_shape}")
        print(f"   Num params:   {model.count_params():,}")

        # Layer summary
        print(f"   Layers:")
        for layer in model.layers[:5]:
            print(f"      - {layer.name} ({layer.__class__.__name__})")
        if len(model.layers) > 5:
            print(f"      ... + {len(model.layers) - 5} more")

    except Exception as e:
        print(f"   ❌ Error: {e}")


def inspect_feature_names_pickle():
    """Load feature_names.pkl and show structure"""
    print(f"\n{'='*70}")
    print(f"📋 feature_names.pkl")
    print(f"{'='*70}")

    path = os.path.join(MODELS_DIR, "feature_names.pkl")
    with open(path, "rb") as f:
        data = pickle.load(f)

    print(f"   Type: {type(data).__name__}")
    if isinstance(data, list):
        print(f"   Count: {len(data)}")
        print(f"   Names: {data}")
    elif isinstance(data, dict):
        for k, v in data.items():
            print(f"   {k}: {len(v) if isinstance(v, list) else v} items")


def inspect_selected_features():
    """Load selected_features.pkl"""
    print(f"\n{'='*70}")
    print(f"📋 selected_features.pkl")
    print(f"{'='*70}")

    path = os.path.join(MODELS_DIR, "selected_features.pkl")
    with open(path, "rb") as f:
        data = pickle.load(f)

    print(f"   Type: {type(data).__name__}")
    if isinstance(data, list):
        print(f"   Count: {len(data)}")
        print(f"   First 10: {data[:10]}")
        print(f"   Last 5:   {data[-5:]}")


# ============================================================
# RUN
# ============================================================
if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🔍 NEUROTWIN AI — MODEL INSPECTION")
    print("=" * 70)

    # ===== Pickle models =====
    inspect_pickle_model("VOICE", os.path.join(MODELS_DIR, "voice_model.pkl"))
    inspect_pickle_model("TREMOR", os.path.join(MODELS_DIR, "xgboost_tremor_model_clinical.pkl"))
    inspect_pickle_model("SCALER", os.path.join(MODELS_DIR, "scaler.pkl"))

    # ===== Keras models =====
    inspect_keras_model("TYPING (LSTM)", os.path.join(MODELS_DIR, "typing_lstm.h5"))
    inspect_keras_model("MEMORY", os.path.join(MODELS_DIR, "best_model.keras"))
    inspect_keras_model("FACE (Emotion)", os.path.join(MODELS_DIR, "emotion_model.h5"))

    # ===== Feature files =====
    inspect_feature_names_pickle()
    inspect_selected_features()

    print("\n" + "=" * 70)
    print("✅ Inspection complete")
    print("=" * 70)