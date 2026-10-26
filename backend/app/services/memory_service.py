# backend/app/services/memory_service.py
from typing import Dict, Any

class MemoryService:
    """Memory assessment service"""
    
    def __init__(self):
        self.levels = {
            "excellent": {"min": 80, "emoji": "🌟", "text": "Excellent memory! Keep challenging your brain!"},
            "good": {"min": 60, "emoji": "👍", "text": "Good memory! Regular practice will help maintain it."},
            "average": {"min": 40, "emoji": "📖", "text": "Average memory. Consider daily memory exercises."},
            "needs_improvement": {"min": 0, "emoji": "💪", "text": "Memory needs improvement. Consider cognitive exercises."}
        }
    
    def calculate_score(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate memory score"""
        score = data.get("score", 0)
        accuracy = data.get("accuracy", 0)
        
        # Determine level
        level = self._get_level(score)
        
        return {
            "score": round(score, 2),
            "accuracy": round(accuracy, 2),
            "level": level["text"],
            "level_emoji": level["emoji"],
            "recommendation": level["text"],
            "memory_quotient": round((score * 0.6 + accuracy * 0.4), 2)
        }
    
    def _get_level(self, score):
        """Get memory level based on score"""
        for level, data in self.levels.items():
            if score >= data["min"]:
                return data
        return self.levels["needs_improvement"]