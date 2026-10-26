# brain_twin/weekly_comparison.py
"""
Digital Brain Twin - Weekly Comparison & Biometric Divergence Analysis
Calculates relative divergence between current week metrics and personal historical baseline.
"""
from typing import Dict, Any, List

class WeeklyComparator:
    @staticmethod
    def compare_with_baseline(
        current_metrics: Dict[str, float], 
        baseline_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compares latest weekly assessment metrics with personal baseline.
        Returns percentage variance, Z-score divergence, and status tags (Stable, Minor Variance, Action Recommended).
        """
        comparisons = {}
        total_divergence = 0.0
        divergence_count = 0
        
        for key, value in current_metrics.items():
            if key in baseline_profile:
                base_data = baseline_profile[key]
                mean_val = base_data.get("mean", value)
                std_val = base_data.get("std", 1.0) if base_data.get("std", 1.0) > 0 else 1.0
                
                diff = value - mean_val
                pct_change = (diff / mean_val * 100.0) if mean_val != 0 else 0.0
                z_score = diff / std_val
                
                # Determine status
                abs_z = abs(z_score)
                if abs_z < 1.2:
                    status = "Stable"
                    severity = "LOW_RISK"
                elif abs_z < 2.2:
                    status = "Minor Variance"
                    severity = "MODERATE"
                else:
                    status = "Significant Shift"
                    severity = "ACTION_RECOMMENDED"
                    
                comparisons[key] = {
                    "current": round(value, 2),
                    "baseline_mean": round(mean_val, 2),
                    "percentage_change": round(pct_change, 1),
                    "z_score": round(z_score, 2),
                    "status": status,
                    "severity": severity
                }
                
                total_divergence += abs_z
                divergence_count += 1
                
        avg_divergence_z = (total_divergence / divergence_count) if divergence_count > 0 else 0.0
        overall_variance_pct = round(avg_divergence_z * 2.8, 1) # Scaling factor for clinical presentation
        
        return {
            "metrics_comparison": comparisons,
            "overall_divergence_z": round(avg_divergence_z, 2),
            "biometric_variance_pct": overall_variance_pct,
            "twin_status": "STABLE" if avg_divergence_z < 1.5 else ("MONITOR" if avg_divergence_z < 2.3 else "ACTION_REQUIRED")
        }
