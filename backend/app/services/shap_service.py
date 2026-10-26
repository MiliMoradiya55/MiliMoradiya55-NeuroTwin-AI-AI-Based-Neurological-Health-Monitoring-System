# backend/app/services/shap_service.py

"""
SHAP-based Explainable AI Service for NeuroTwin AI.

Working modules (SHAP-supported):
- Voice:  XGBoost Classifier (21 features) → TreeExplainer  [polarity: classifier]
- Tremor: XGBoost Classifier (8 features) → TreeExplainer   [polarity: classifier]
- Typing: Keras LSTM (10, 18) → GradientExplainer           [polarity: regressor]

Non-SHAP modules (use rule-based attribution):
- Memory: rule-based
- Face:   rule-based

Polarity note:
- Classifier modules predict "atypical" (bad). A + SHAP pushes toward atypical,
  which is BAD for health — so we invert the sign for user-facing labels.
- Regressor modules predict health score directly. A + SHAP is GOOD.
"""

import os
import logging
import numpy as np
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)

try:
    import shap
    HAS_SHAP = True
    logger.info(f"✅ SHAP loaded: {shap.__version__}")
except ImportError:
    HAS_SHAP = False
    logger.warning("⚠️ SHAP not installed")

try:
    from tensorflow import keras
    HAS_TF = True
except ImportError:
    HAS_TF = False

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False


# ============================================================
# MODEL FILES
# ============================================================
MODEL_FILES = {
    "voice": "voice_model.pkl",
    "tremor": "xgboost_tremor_model_clinical.pkl",
    "typing": "typing_lstm.h5",
    "memory": "best_model.keras",
    "face": "emotion_model.h5",
}

# ============================================================
# FEATURE NAMES (MUST MATCH TRAINING ORDER)
# ============================================================
VOICE_FEATURE_NAMES = [
    "pitch_mean", "pitch_std", "pitch_min", "pitch_max",
    "jitter", "shimmer", "hnr", "voice_tremor", "speech_rate",
    "rms_mean", "rms_std",
    "spectral_centroid_mean", "spectral_centroid_std",
    "mfcc_1_mean", "mfcc_1_std",
    "mfcc_2_mean", "mfcc_2_std",
    "mfcc_3_mean", "mfcc_3_std",
    "mfcc_4_mean", "mfcc_4_std",
]

TREMOR_FEATURE_NAMES = [
    "tremor_frequency", "tremor_amplitude", "hand_stability",
    "jerk", "variance", "range_movement",
    "wrist_stability", "wrist_movement",
]

TYPING_FEATURE_NAMES = [
    "hold_time_mean", "hold_time_std", "hold_time_min", "hold_time_max",
    "latency_mean", "latency_std", "latency_min", "latency_max",
    "flight_time_mean", "flight_time_std", "flight_time_min", "flight_time_max",
    "wpm",
    "key_press_variance", "rhythm_variance",
    "backspace_frequency", "error_rate", "consistency_score",
]

# ============================================================
# POLARITY CONFIGURATION
# ============================================================
# Modules whose model output is "atypical/risk" (higher = worse).
# We flip the sign of SHAP values so positive SHAP → negative impact.
CLASSIFIER_MODULES = {"voice", "tremor"}


def _models_dir() -> str:
    current = os.path.abspath(__file__)
    backend = os.path.dirname(os.path.dirname(os.path.dirname(current)))
    return os.path.join(backend, "models")


# ============================================================
# SERVICE
# ============================================================
class ShapService:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.explainers: Dict[str, Any] = {}
        self.scalers: Dict[str, Any] = {}
        self.metadata: Dict[str, Dict] = {}

    # =====================================================
    # LOAD MODEL
    # =====================================================
    def load_model(self, module: str) -> bool:
        if module in self.models:
            return True

        filename = MODEL_FILES.get(module)
        if not filename:
            logger.error(f"No model file mapped for '{module}'")
            return False

        path = os.path.join(_models_dir(), filename)
        if not os.path.exists(path):
            logger.error(f"File not found: {path}")
            return False

        try:
            # ===== KERAS MODELS =====
            if path.endswith((".h5", ".keras")):
                if not HAS_TF:
                    logger.error("TensorFlow not available")
                    return False
                self.models[module] = keras.models.load_model(path, compile=False)
                logger.info(f"✅ Loaded {module} (Keras)")

                # Load separate scaler for typing
                if module == "typing" and HAS_JOBLIB:
                    scaler_path = os.path.join(_models_dir(), "scaler.pkl")
                    if os.path.exists(scaler_path):
                        try:
                            self.scalers[module] = joblib.load(scaler_path)
                            logger.info(f"✅ Loaded typing scaler: scaler.pkl")
                        except Exception as e:
                            logger.warning(f"⚠️ Typing scaler failed to load: {e}")
                    else:
                        logger.warning(f"⚠️ Typing scaler not found at {scaler_path}")

                return True

            # ===== PICKLE MODELS =====
            if path.endswith(".pkl"):
                if not HAS_JOBLIB:
                    logger.error("joblib not available")
                    return False
                obj = joblib.load(path)

                if isinstance(obj, dict):
                    logger.info(f"📦 {module} is dict: {list(obj.keys())}")

                    if "model" not in obj:
                        logger.error(f"Dict missing 'model' key: {list(obj.keys())}")
                        return False

                    self.models[module] = obj["model"]
                    self.metadata[module] = {k: v for k, v in obj.items() if k != "model"}

                    if "scaler" in obj:
                        self.scalers[module] = obj["scaler"]
                    if "feature_names" in obj:
                        self.metadata[module]["feature_names"] = obj["feature_names"]

                    logger.info(f"✅ Loaded {module} from dict")
                else:
                    self.models[module] = obj
                    logger.info(f"✅ Loaded {module} ({type(obj).__name__})")

                return True

            logger.error(f"Unsupported format: {path}")
            return False

        except Exception as e:
            logger.error(f"Load failed for {module}: {e}", exc_info=True)
            return False

    # =====================================================
    # EXPLAIN
    # =====================================================
    def explain(
        self,
        module: str,
        X_input: np.ndarray,
        feature_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:

        if not HAS_SHAP:
            return self._fallback(module, "SHAP not installed")

        # Block image-based modules
        if module in ("memory", "face"):
            return self._fallback(
                module,
                f"{module} model expects 48x48 image input. SHAP requires image tensors. "
                f"Use rule-based XAI for this module."
            )

        if not self.load_model(module):
            return self._fallback(module, "Model not loaded")

        model = self.models[module]

        if feature_names is None:
            feature_names = {
                "voice": VOICE_FEATURE_NAMES,
                "tremor": TREMOR_FEATURE_NAMES,
                "typing": TYPING_FEATURE_NAMES,
            }.get(module, [])

        try:
            if X_input.ndim == 1:
                X_input = X_input.reshape(1, -1)

            X_scaled = self._maybe_scale(module, X_input)

            if module == "typing":
                X_scaled = self._reshape_typing(X_scaled, model)

            explainer = self._get_explainer(module, model, X_scaled)
            if explainer is None:
                return self._fallback(module, "Explainer creation failed")

            shap_values = self._compute_shap(explainer, X_scaled, module)

            return self._format_output(
                module, shap_values, X_scaled, feature_names, explainer
            )

        except Exception as e:
            logger.error(f"SHAP error [{module}]: {e}", exc_info=True)
            return self._fallback(module, str(e))

    # =====================================================
    # EXPLAINER FACTORY
    # =====================================================
    def _get_explainer(self, module: str, model: Any, X: np.ndarray):
        if module in self.explainers:
            return self.explainers[module]

        try:
            model_type = type(model).__name__.lower()

            if any(t in model_type for t in ["xgb", "forest", "tree", "lgbm", "gradient"]):
                self.explainers[module] = shap.TreeExplainer(model)
                logger.info(f"✅ {module}: TreeExplainer")
                return self.explainers[module]

            if HAS_TF and isinstance(model, keras.Model):
                if module == "typing":
                    seq_len = model.input_shape[1]
                    n_feat = model.input_shape[-1]
                    background = np.zeros((20, seq_len, n_feat), dtype=np.float32)
                    self.explainers[module] = shap.GradientExplainer(model, background)
                    logger.info(f"✅ {module}: GradientExplainer (LSTM)")
                    return self.explainers[module]
                else:
                    background = np.zeros((10,) + tuple(model.input_shape[1:]), dtype=np.float32)
                    self.explainers[module] = shap.DeepExplainer(model, background)
                    logger.info(f"✅ {module}: DeepExplainer")
                    return self.explainers[module]

            background = np.zeros((30, X.shape[-1]), dtype=np.float32)
            self.explainers[module] = shap.KernelExplainer(model.predict, background)
            logger.info(f"✅ {module}: KernelExplainer")
            return self.explainers[module]

        except Exception as e:
            logger.error(f"Explainer creation failed [{module}]: {e}")
            return None

    # =====================================================
    # COMPUTE SHAP
    # =====================================================
    def _compute_shap(self, explainer, X: np.ndarray, module: str) -> np.ndarray:
        if isinstance(explainer, shap.TreeExplainer):
            sv = explainer.shap_values(X)
            if isinstance(sv, list):
                sv = sv[-1]
            sv = np.array(sv)

        elif isinstance(explainer, shap.GradientExplainer):
            sv = explainer.shap_values(X)
            if isinstance(sv, list):
                sv = sv[0]
            sv = np.array(sv)
            if sv.ndim == 3:
                sv = sv.mean(axis=1)
            if sv.ndim == 1:
                sv = sv.reshape(1, -1)

        elif isinstance(explainer, shap.DeepExplainer):
            sv = explainer.shap_values(X)
            if isinstance(sv, list):
                sv = sv[0]
            sv = np.array(sv)
            if sv.ndim == 3:
                sv = sv.mean(axis=1)
        else:
            sv = explainer.shap_values(X, nsamples=100)
            if isinstance(sv, list):
                sv = sv[0]
            sv = np.array(sv)

        return sv

    # =====================================================
    # FORMAT OUTPUT — WITH POLARITY FIX
    # =====================================================
    def _format_output(self, module, shap_values, X_input, feature_names, explainer):
        if shap_values.ndim > 1:
            shap_values = shap_values.flatten()
        if X_input.ndim == 3:
            X_input = X_input.mean(axis=1)
        if X_input.ndim > 1:
            X_input = X_input.flatten()

        n = min(len(feature_names), len(shap_values), len(X_input))
        vals = shap_values[:n]
        inputs = X_input[:n]
        names = feature_names[:n]

        # ✅ Polarity fix: classifier modules invert the sign
        is_classifier = module in CLASSIFIER_MODULES
        sign_flip = -1.0 if is_classifier else 1.0

        features = []
        for name, val, sv in zip(names, inputs, vals):
            raw_sv = float(sv)
            oriented_sv = raw_sv * sign_flip   # user-facing polarity
            features.append({
                "feature": name,
                "value": round(float(val), 4),
                # Keep the raw SHAP for reference (model-logic values)
                "shap_value_raw": round(raw_sv, 4),
                # Oriented SHAP: positive = good for health, negative = bad
                "shap_value": round(oriented_sv, 4),
                "abs_shap": round(abs(oriented_sv), 4),
                "direction": "positive" if oriented_sv > 0 else "negative",
            })

        features.sort(key=lambda x: x["abs_shap"], reverse=True)

        base = None
        try:
            if hasattr(explainer, "expected_value"):
                ev = explainer.expected_value
                if isinstance(ev, (list, np.ndarray)):
                    base = float(np.array(ev).flatten()[-1])
                else:
                    base = float(ev)
        except Exception:
            pass

        pred = float(base + vals.sum()) if base is not None else None

        top_pos = [f for f in features if f["shap_value"] > 0][:3]
        top_neg = [f for f in features if f["shap_value"] < 0][:3]

        return {
            "method": type(explainer).__name__,
            "polarity": "classifier_inverted" if is_classifier else "regressor_direct",
            "base_value": base,
            "prediction": pred,
            "features": features,
            "top_positive": top_pos,
            "top_negative": top_neg,
            "total_positive": round(sum(f["shap_value"] for f in features if f["shap_value"] > 0), 3),
            "total_negative": round(sum(f["shap_value"] for f in features if f["shap_value"] < 0), 3),
        }

    # =====================================================
    # HELPERS
    # =====================================================
    def _maybe_scale(self, module: str, X: np.ndarray) -> np.ndarray:
        scaler = self.scalers.get(module)
        if scaler is None:
            return X
        try:
            shape = X.shape
            flat = X.reshape(-1, shape[-1])
            scaled = scaler.transform(flat)
            return scaled.reshape(shape)
        except Exception as e:
            logger.warning(f"Scaler failed [{module}]: {e}")
            return X

    def _reshape_typing(self, X: np.ndarray, model) -> np.ndarray:
        seq_len = model.input_shape[1]
        n_feat = model.input_shape[-1]

        if X.ndim == 3:
            return X

        if X.ndim == 2:
            if X.shape[-1] < n_feat:
                pad = np.zeros((X.shape[0], n_feat - X.shape[-1]), dtype=np.float32)
                X = np.concatenate([X, pad], axis=1)
            elif X.shape[-1] > n_feat:
                X = X[:, :n_feat]
            X = np.repeat(X[:, np.newaxis, :], seq_len, axis=1)
            logger.info(f"🔁 Typing reshaped to {X.shape}")

        return X

    def _fallback(self, module: str, reason: str) -> Dict[str, Any]:
        return {
            "method": "unavailable",
            "module": module,
            "reason": reason,
            "features": [],
        }


# ============================================================
# SINGLETON
# ============================================================
_shap_service: Optional[ShapService] = None


def get_shap_service() -> ShapService:
    global _shap_service
    if _shap_service is None:
        _shap_service = ShapService()
    return _shap_service