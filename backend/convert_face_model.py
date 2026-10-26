# backend/convert_face_model.py

import os
import json
import numpy as np

# ===== FIX: Use Keras 3 =====
import keras

print("=" * 60)
print("🔧 CONVERTING FACE MODEL (Keras 3)")
print("=" * 60)
print(f"✅ Keras: {keras.__version__}")

# ===== Load your existing model =====
model_path = 'models/emotion_model.keras'

if not os.path.exists(model_path):
    print(f"❌ Model not found: {model_path}")
    exit(1)

print(f"\n📁 Loading model: {model_path}")

try:
    # ===== FIX: Load with Keras 3 =====
    model = keras.models.load_model(model_path, compile=False)
    print("✅ Model loaded successfully with Keras 3!")

    # ===== Test the model =====
    print("\n🧪 Testing model...")
    dummy_input = np.random.randn(1, 48, 48, 1)
    predictions = model.predict(dummy_input, verbose=0)
    print(f"📊 Predictions: {predictions[0]}")
    print(f"📊 Sum: {np.sum(predictions[0]):.4f}")
    print(f"📊 Predicted class: {np.argmax(predictions[0])}")

    # ===== Save as H5 (compatible with Keras 2) =====
    print("\n📁 Saving as H5...")
    h5_path = 'models/emotion_model.h5'
    model.save(h5_path, save_format='h5')
    print(f"✅ Saved as H5: {h5_path}")

    # ===== Save labels =====
    labels_path = 'models/labels.json'
    if os.path.exists(labels_path):
        with open(labels_path, 'r') as f:
            labels = json.load(f)
        print(f"✅ Labels: {labels.get('emotions', [])}")

    print("\n✅ Conversion complete!")
    print(f"📁 H5 model: {h5_path}")

except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("\n📌 Make sure the model file exists at: models/emotion_model.keras")