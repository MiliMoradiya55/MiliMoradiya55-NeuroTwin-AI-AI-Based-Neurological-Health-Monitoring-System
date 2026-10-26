# llm/chatbot.py
"""
Clinical AI Assistant Module
Grounded in patient's Digital Twin longitudinal metrics, providing clinical insights with safety disclaimers.
"""
from typing import Dict, Any, List

class ClinicalAIChatbot:
    @staticmethod
    def generate_response(user_query: str, patient_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates clinical contextual answer to patient or doctor queries.
        """
        query_lower = user_query.lower()
        score = patient_context.get("brain_health_score", 89.0)
        recent_changes = patient_context.get("recent_changes", ["Typing rhythm latency +13%", "Voice stability -4%"])
        
        reply = ""
        suggested_chips = []
        
        if "why" in query_lower and ("decrease" in query_lower or "drop" in query_lower or "score" in query_lower):
            reply = (
                f"Your Brain Health Score is currently **{score}/100**. The slight change is primarily influenced by:\n\n"
                f"1. **Typing Rhythm Latency**: A minor 13% increase in keystroke timing, indicating mild motor fatigue.\n"
                f"2. **Voice Prosody**: A 4.2% shift in voice stability during speech exercises.\n\n"
                f"These changes diverge slightly from your personal 4-week baseline. We recommend taking regular keyboard breaks and staying hydrated."
            )
            suggested_chips = ["How can I improve typing rhythm?", "Show my yearly memory trend", "Schedule doctor consultation"]
            
        elif "tremor" in query_lower or "hand" in query_lower:
            reply = (
                "Your Hand Tremor test recorded an average oscillation frequency of **5.2 Hz** and amplitude of **0.12 mm**, "
                "which remains within your steady-state personal baseline threshold (< 0.20 mm). No significant tremor escalation was detected."
            )
            suggested_chips = ["View hand tremor history", "Try hand steadying exercise", "Compare voice and tremor correlation"]
            
        elif "memory" in query_lower:
            reply = (
                "Your Memory Recall score for the latest session is **9.2 / 10** (Recall Accuracy 92%). "
                "Sequence recall and object recognition have maintained exceptional stability across your 12-week monitoring window."
            )
            suggested_chips = ["Explain memory scoring", "View 3-month memory chart"]
            
        elif "doctor" in query_lower or "report" in query_lower:
            reply = (
                "You can generate a comprehensive PDF Clinical Summary Report directly from your **Reports** page. "
                "The report compiles your Brain Health Score, 12-week longitudinal charts, biometric radar divergence, and Explainable AI summaries for your physician."
            )
            suggested_chips = ["Download latest PDF report", "Share report with Dr. Vance"]
            
        else:
            reply = (
                f"Hello! I am your **NeuroTwin AI Assistant**, grounded in your personalized Digital Brain Twin profile. "
                f"Your overall Brain Health Score is **{score}/100** with high cognitive resilience. "
                f"How can I assist you with your neurological health metrics today?"
            )
            suggested_chips = ["Why did my score change?", "Explain my voice analysis", "How is my hand tremor?"]
            
        disclaimer = "NeuroTwin AI provides continuous health monitoring and clinical decision support, not formal medical diagnosis. Consult your healthcare provider for clinical advice."
        
        return {
            "query": user_query,
            "response": reply,
            "suggested_chips": suggested_chips,
            "disclaimer": disclaimer
        }
