# backend/inspect_tremor.py
import joblib
import os

path = "models/xgboost_tremor_model_clinical.pkl"
data = joblib.load(path)

print(f"Type: {type(data).__name__}")
print(f"Keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
print()

if isinstance(data, dict):
    for key, value in data.items():
        print(f"=== {key} ===")
        print(f"  Type: {type(value).__name__}")
        
        if hasattr(value, "n_features_in_"):
            print(f"  n_features_in_: {value.n_features_in_}")
        if hasattr(value, "feature_names_in_"):
            print(f"  feature_names_in_: {list(value.feature_names_in_)}")
        if hasattr(value, "get_booster"):
            print(f"  Booster features: {value.get_booster().feature_names}")
        if isinstance(value, list):
            print(f"  List items: {value[:10]}")
        print()