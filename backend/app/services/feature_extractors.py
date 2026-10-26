# backend/app/services/feature_extractors.py

"""
Feature extractors — convert DB records into model-ready feature vectors.
The ORDER must match training. Update the lists if your training order differs.
"""

from typing import List, Any
import numpy as np


# ============================================================
# FEATURE ORDER (must match training)
# ============================================================
# ⚠️ IMPORTANT: If your training used different order, update here.
# You can verify by loading feature_names.pkl

FEATURE_ORDER = {
    "voice": [
        "pitch", "jitter", "shimmer", "hnr",
        "voice_tremor", "speech_rate", "duration"
    ],
    "tremor": [
        "tremor_frequency", "tremor_intensity", "hand_stability",
        "finger_movement"
    ],
    "typing": [
        "hold_time_mean", "hold_time_std", "latency_mean", "latency_std",
        "flight_time_mean", "flight_time_std", "typing_speed",
        "key_press_variance", "rhythm_variance", "backspace_frequency",
        "error_rate", "consistency_score"
    ],
    "memory": [
        "accuracy", "correct_count", "avg_reaction_time"
    ],
    "face": [
        "smile_intensity", "facial_symmetry", "blink_rate",
        "eye_movement", "facial_muscle_activity"
    ],
}


def extract_voice_features(a: Any) -> List[float]:
    """VoiceAssessment → feature vector"""
    return [
        float(a.pitch or 0),
        float(a.jitter or 0),
        float(a.shimmer or 0),
        float(a.hnr or 0),
        float(a.voice_tremor or 0),
        float(a.speech_rate or 0),
        float(a.duration or 0),
    ]


def extract_tremor_features(a: Any) -> List[float]:
    """TremorAssessment → feature vector"""
    return [
        float(a.tremor_frequency or 0),
        float(getattr(a, "tremor_intensity", 0) or 0),
        float(a.hand_stability or 0),
        float(a.finger_movement or 0),
    ]


def extract_typing_features(a: Any) -> List[float]:
    """TypingAssessment → feature vector"""
    return [
        float(getattr(a, "hold_time_mean", 0) or 0),
        float(getattr(a, "hold_time_std", 0) or 0),
        float(getattr(a, "latency_mean", 0) or a.avg_latency or 0),
        float(getattr(a, "latency_std", 0) or 0),
        float(getattr(a, "flight_time_mean", 0) or 0),
        float(getattr(a, "flight_time_std", 0) or 0),
        float(a.wpm or 0),
        float(getattr(a, "key_press_variance", 0) or 0),
        float(getattr(a, "rhythm_variance", 0) or 0),
        float(getattr(a, "backspace_frequency", 0) or 0),
        float(a.error_rate or 0),
        float(getattr(a, "consistency_score", 0) or 0),
    ]


def extract_memory_features(a: Any) -> List[float]:
    """MemoryAssessment → feature vector"""
    return [
        float(a.accuracy or 0),
        float(a.correct_count or 0),
        float(a.avg_reaction_time or 0),
    ]


def extract_face_features(a: Any) -> List[float]:
    """FaceAssessment → feature vector"""
    return [
        float(a.smile_intensity or 0),
        float(a.facial_symmetry or 0),
        float(a.blink_rate or 0),
        float(a.eye_movement or 0),
        float(a.facial_muscle_activity or 0),
    ]


EXTRACTORS = {
    "voice": extract_voice_features,
    "tremor": extract_tremor_features,
    "typing": extract_typing_features,
    "memory": extract_memory_features,
    "face": extract_face_features,
}


def get_feature_vector(module: str, assessment: Any) -> np.ndarray:
    """Returns numpy array of features in the correct order"""
    fn = EXTRACTORS.get(module)
    if fn is None:
        raise ValueError(f"Unknown module: {module}")
    return np.array(fn(assessment), dtype=np.float32)