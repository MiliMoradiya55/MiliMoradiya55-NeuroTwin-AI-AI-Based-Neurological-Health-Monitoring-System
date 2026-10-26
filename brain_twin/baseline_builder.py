# brain_twin/baseline_builder.py
"""
Digital Brain Twin - Baseline Builder Module
Calibrates and updates a user's 4-week neuro-cognitive baseline profile across 6 key signal domains.
"""
from typing import Dict, Any, List
import statistics

class BaselineBuilder:
    @staticmethod
    def calculate_domain_baseline(historical_assessments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Processes past 4 weeks of raw assessment metrics and creates expected normal distributions (mean, std_dev, min, max).
        """
        metrics_by_key: Dict[str, List[float]] = {}
        
        for item in historical_assessments:
            metrics = item.get("metrics", {})
            for key, val in metrics.items():
                if isinstance(val, (int, float)):
                    if key not in metrics_by_key:
                        metrics_by_key[key] = []
                    metrics_by_key[key].append(float(val))
                    
        baseline_profile = {}
        for key, values in metrics_by_key.items():
            if not values:
                continue
            mean_val = statistics.mean(values)
            std_dev = statistics.stdev(values) if len(values) > 1 else 0.05 * mean_val
            baseline_profile[key] = {
                "mean": round(mean_val, 2),
                "std": round(std_dev, 2),
                "min": round(min(values), 2),
                "max": round(max(values), 2),
                "sample_count": len(values)
            }
            
        return baseline_profile

    @staticmethod
    def get_default_baseline() -> Dict[str, Any]:
        """Returns standard starting baseline metrics for new calibration profiles."""
        return {
            "voice_pitch_hz": {"mean": 145.0, "std": 12.0, "normal_range": "120 - 180 Hz"},
            "voice_jitter_pct": {"mean": 0.42, "std": 0.08, "normal_range": "0.2 - 0.8 %"},
            "speech_pauses_count": {"mean": 2.1, "std": 0.5, "normal_range": "1 - 3 pauses"},
            "hand_tremor_mm": {"mean": 0.15, "std": 0.03, "normal_range": "< 0.25 mm"},
            "tremor_freq_hz": {"mean": 5.2, "std": 0.8, "normal_range": "4.0 - 7.0 Hz"},
            "blink_rate_per_min": {"mean": 16.5, "std": 2.5, "normal_range": "12 - 22 / min"},
            "facial_symmetry_index": {"mean": 0.96, "std": 0.02, "normal_range": "0.90 - 1.00"},
            "memory_recall_score": {"mean": 9.2, "std": 0.6, "normal_range": "8.0 - 10.0"},
            "typing_latency_ms": {"mean": 41.5, "std": 4.2, "normal_range": "35 - 55 ms"},
            "typing_error_rate_pct": {"mean": 2.4, "std": 0.8, "normal_range": "1.0 - 4.0 %"},
            "reaction_time_ms": {"mean": 245.0, "std": 18.0, "normal_range": "200 - 300 ms"}
        }
