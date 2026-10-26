# brain_twin/health_score.py
"""
Digital Brain Twin - Brain Health Score Calculator
Synthesizes sub-domain assessment scores into a unified Brain Health Index (0-100).
"""
from typing import Dict, Any

class BrainHealthCalculator:
    DOMAIN_WEIGHTS = {
        "voice": 0.20,
        "tremor": 0.20,
        "face": 0.15,
        "memory": 0.20,
        "typing": 0.15,
        "reaction": 0.10
    }
    
    @classmethod
    def calculate_composite_score(cls, domain_scores: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates composite Brain Health Score (0-100) based on domain weights.
        """
        composite_score = 0.0
        applied_weight = 0.0
        breakdown = {}
        
        for domain, weight in cls.DOMAIN_WEIGHTS.items():
            score = domain_scores.get(domain, 90.0)
            score = max(0.0, min(100.0, float(score)))
            composite_score += score * weight
            applied_weight += weight
            breakdown[domain] = {
                "score": round(score, 1),
                "weight": weight,
                "status": "Optimal" if score >= 88 else ("Minor Variance" if score >= 75 else "Action Recommended")
            }
            
        final_score = round(composite_score / applied_weight, 1) if applied_weight > 0 else 89.0
        
        return {
            "brain_health_score": final_score,
            "category": "Optimal Resilience" if final_score >= 88 else ("Mild Variance" if final_score >= 78 else "Clinical Review Recommended"),
            "domain_scores": breakdown
        }
