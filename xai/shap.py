# xai/shap.py
"""
Explainable AI (XAI) - Feature Attribution & SHAP-like Divergence Explainer
Decomposes score changes into human-understandable clinical contributions.
"""
from typing import Dict, Any, List

class XAIExplainer:
    @staticmethod
    def generate_score_explanation(
        previous_score: float, 
        current_score: float, 
        metrics_divergence: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates structured Explainable AI breakdown explaining WHY the score changed.
        """
        score_diff = round(current_score - previous_score, 1)
        attributions: List[Dict[str, Any]] = []
        
        # Human readable mapping
        metric_names = {
            "voice_pitch_hz": "Voice Pitch Stability",
            "voice_jitter_pct": "Voice Micro-Tremor (Jitter)",
            "speech_pauses_count": "Speech Hesitation / Pauses",
            "hand_tremor_mm": "Hand Tremor Amplitude",
            "tremor_freq_hz": "Hand Tremor Frequency",
            "blink_rate_per_min": "Blink Frequency",
            "facial_symmetry_index": "Facial Micro-Symmetry",
            "memory_recall_score": "Memory Recall Accuracy",
            "typing_latency_ms": "Typing Keystroke Latency",
            "typing_error_rate_pct": "Typing Error Frequency",
            "reaction_time_ms": "Visual Reaction Speed"
        }
        
        comparisons = metrics_divergence.get("metrics_comparison", {})
        
        for key, comp in comparisons.items():
            z = comp.get("z_score", 0.0)
            pct = comp.get("percentage_change", 0.0)
            
            # Key feature attribution weights
            if abs(z) > 0.8:
                readable_name = metric_names.get(key, key.replace("_", " ").title())
                impact_pct = round(abs(z) * 4.5, 1)
                direction = "increased" if pct > 0 else "decreased"
                
                attributions.append({
                    "feature": readable_name,
                    "metric_key": key,
                    "z_score": z,
                    "change_pct": pct,
                    "impact_attribution": f"{readable_name} {direction} by {abs(pct)}%",
                    "impact_weight": impact_pct,
                    "clinical_relevance": f"Diverges by {abs(z):.1f} std deviations from personal baseline."
                })
                
        # Sort by impact weight
        attributions.sort(key=lambda x: x["impact_weight"], reverse=True)
        
        summary_sentences = []
        if score_diff < 0:
            summary_sentences.append(f"Brain Health Score adjusted by {score_diff} points from previous evaluation.")
        elif score_diff > 0:
            summary_sentences.append(f"Brain Health Score improved by +{score_diff} points compared to last week.")
        else:
            summary_sentences.append("Brain Health Score remains steady and aligns with historical baseline.")
            
        for attr in attributions[:3]:
            summary_sentences.append(f"• {attr['impact_attribution']} ({attr['clinical_relevance']}).")
            
        return {
            "score_delta": score_diff,
            "top_attributions": attributions[:5],
            "explanation_summary": "\n".join(summary_sentences),
            "methodology": "Personalized Z-Score SHAP-Feature Attribution"
        }
