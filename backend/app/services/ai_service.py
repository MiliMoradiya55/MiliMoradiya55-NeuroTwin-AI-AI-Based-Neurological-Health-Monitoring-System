# backend/app/services/ai_service.py

import os
import re
import random
import logging
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
    logger.warning("⚠️ google-generativeai not installed. Run: pip install google-generativeai")


class AIService:
    """
    AI chat service with Google Gemini integration + smart context-aware fallback.

    Polarity conventions:
    - Voice & tremor: classifier models. The backend already flips SHAP signs,
      so "positive" in context = good for health, "negative" = bad for health.
    - Typing: regressor. Positive SHAP = good for health (already in score units).
    """

    def __init__(self):
        self.model = None
        self.chat = None
        self.is_ready = False
        self.model_name = "none"

        self.fallback_responses = {
            "greeting": [
                "Hello! I'm your NeuroTwin AI Assistant. How can I help you with your brain health today?",
                "Hi! I'm here to help you understand your neurological health metrics.",
                "Welcome back! Ready to explore your brain health data?",
            ],
            "voice": [
                "Your voice analysis shows stable patterns. Keep monitoring regularly for best insights.",
                "I notice some variations in your voice. This is normal and can be affected by time of day.",
                "Your vocal health is looking good based on your recent assessments!",
            ],
            "memory": [
                "Your memory scores are consistent with your baseline.",
                "I see improvement in your memory recall — great progress!",
                "Your memory patterns are stable. Continue your regular assessments.",
            ],
            "tremor": [
                "Your hand tremor is within normal range.",
                "Your tremor patterns remain stable compared to your baseline.",
                "Hand stability looks good in your latest assessment.",
            ],
            "typing": [
                "Your typing rhythm is consistent. Motor coordination looks stable.",
                "Your typing pattern shows good consistency with your baseline.",
                "Keystroke timing is within your normal range.",
            ],
            "face": [
                "Your facial expression analysis shows stable symmetry and expressiveness.",
                "Facial metrics are within your normal range.",
                "Your facial symmetry and expression patterns look good.",
            ],
            "score": [
                "Your Brain Health Score is calculated from all 5 assessment modules.",
                "Your score changes reflect natural variance in your daily measurements.",
                "I recommend continuing your weekly assessments for accurate tracking.",
            ],
            "general": [
                "Based on your data, your brain health appears stable.",
                "I recommend continuing your regular assessments for best insights.",
                "Your progress is looking good! Keep up with your assessment schedule.",
            ],
        }

        if HAS_GEMINI:
            self._init_gemini()
        else:
            logger.warning("⚠️ Running in fallback mode (no Gemini)")

    # ============================================================
    # GEMINI INITIALIZATION
    # ============================================================
    def _init_gemini(self):
        try:
            api_key = os.getenv("GEMINI_API_KEY", "").strip()

            if not api_key or api_key == "PASTE_YOUR_NEW_API_KEY_HERE":
                logger.warning("⚠️ GEMINI_API_KEY not set. Using fallback responses.")
                return

            genai.configure(api_key=api_key)

            MODELS_TO_TRY = [
                'models/gemini-3.5-flash-lite',
                'models/gemini-3.1-flash-lite',
                'models/gemini-2.5-flash',
                'models/gemini-2.0-flash',
                'models/gemini-flash-latest',
            ]

            for model_name in MODELS_TO_TRY:
                try:
                    model = genai.GenerativeModel(model_name)
                    test_response = model.generate_content("hi")
                    if test_response and test_response.text:
                        self.model = model
                        self.chat = self.model.start_chat(history=[])
                        self.is_ready = True
                        self.model_name = model_name
                        logger.info(f"✅ Gemini AI Service initialized with: {model_name}")
                        return
                except Exception as e:
                    logger.debug(f"Model {model_name} not available: {str(e)[:100]}")
                    continue

            logger.warning("⚠️ No Gemini model could be initialized. Using fallback mode.")
            self.is_ready = False

        except Exception as e:
            logger.error(f"❌ Gemini initialization failed: {e}")
            self.is_ready = False

    # ============================================================
    # PUBLIC METHODS
    # ============================================================
    async def get_ai_response(
        self,
        message: str,
        context: Optional[Dict] = None,
        user: Optional[Any] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        enriched_message = self._build_prompt(message, context, user, language)

        if self.is_ready:
            try:
                response_text = await self._call_gemini(enriched_message, language)
                if response_text:
                    return {
                        "text": response_text,
                        "suggestions": self._get_suggestions(language, context),
                        "source": "gemini",
                    }
            except Exception as e:
                logger.warning(f"Gemini call failed: {e}. Using fallback.")

        return {
            "text": self._get_fallback_response(message, context, user, language),
            "suggestions": self._get_suggestions(language, context),
            "source": "fallback",
        }

    def get_response(
        self,
        message: str,
        context: Optional[Dict] = None,
        user: Optional[Any] = None,
    ) -> Dict[str, Any]:
        return {
            "text": self._get_fallback_response(message, context, user, "en"),
            "suggestions": self._get_suggestions("en", context),
        }

    def clear_history(self):
        if self.is_ready and self.model:
            self.chat = self.model.start_chat(history=[])
            logger.info("✅ Chat history cleared")

    # ============================================================
    # PROMPT BUILDER
    # ============================================================
    def _build_prompt(
        self,
        message: str,
        context: Optional[Dict],
        user: Optional[Any],
        language: str,
    ) -> str:
        lang_map = {
            "en": "English",
            "english": "English",
            "hi": "Hindi (in Devanagari script)",
            "hindi": "Hindi (in Devanagari script)",
            "gu": "Gujarati (in Gujarati script)",
            "gujarati": "Gujarati (in Gujarati script)",
        }
        lang_name = lang_map.get(language.lower(), "English")

        instructions = (
            f"You are NeuroTwin AI, a clinical assistant for a neurological health monitoring app. "
            f"Respond ONLY in {lang_name}. Use plain text (no markdown symbols like #, *, -, `). "
            f"Be warm, professional, and concise (2-4 sentences, unless the user asks for detail). "
            f"\n\n"
            f"⚠️ CRITICAL RULES — FOLLOW EXACTLY:\n"
            f"1. The CONTEXT DATA below is REAL and CURRENT user data.\n"
            f"2. NEVER say 'I do not have your data' — the data IS provided below.\n"
            f"3. If asked about 'last test' or 'last assessment', use latest_assessment.date and days_ago.\n"
            f"4. If asked about a module (voice/memory/tremor/typing/face), use module_trends[key].latest.\n"
            f"5. If asked about trends, use module_trends[key].trend_direction.\n"
            f"6. If asked 'what does X score mean', use module_explanations[key].\n"
            f"7. Always reference the user by their name if provided.\n"
            f"8. Use EXACT numbers from context — never invent any.\n"
            f"9. Do NOT provide medical diagnoses — only monitoring insights.\n"
            f"10. If data shows 'has_data: false', THEN say you don't have data yet.\n"
            f"\n"
            f"⚠️ WHY-QUESTIONS — XAI ATTRIBUTIONS:\n"
            f"If the user asks 'why' something changed or 'what is driving' a score, "
            f"you MUST use the XAI FEATURE ATTRIBUTIONS section below. Cite specific "
            f"feature names and their contribution values.\n"
            f"\n"
            f"⚠️ POLARITY — VERY IMPORTANT:\n"
            f"All SHAP values below have ALREADY been polarity-corrected:\n"
            f"  • Positive (+) contribution = GOOD for the user's health.\n"
            f"  • Negative (-) contribution = BAD for the user's health.\n"
            f"Do NOT try to reinterpret classifier-vs-regressor internally. "
            f"Simply report the sign as it appears: + means helping, - means hurting.\n"
            f"For example: 'shimmer contributed -4.32' means shimmer is HURTING the score. "
            f"'jitter contributed -4.23' means jitter is HURTING the score.\n"
        )

        context_lines: List[str] = []

        # --- User basics ---
        if user:
            name = getattr(user, "name", None) or (
                user.get("name") if isinstance(user, dict) else None
            )
            if name:
                context_lines.append(f"User Name: {name}")

        if context and context.get("user"):
            u = context["user"]
            if u.get("age"):
                context_lines.append(f"Age: {u['age']}")
            if u.get("gender"):
                context_lines.append(f"Gender: {u['gender']}")

        # --- Overall status ---
        if context and context.get("overall_status"):
            s = context["overall_status"]
            context_lines.append(
                f"Overall Brain Health: {s.get('score', 0)}/100 "
                f"({s.get('level', 'stable')} — {s.get('description', '')})"
            )

        # --- Latest assessment ---
        if context and context.get("latest_assessment"):
            la = context["latest_assessment"]
            mods = la.get("modules", {})
            context_lines.append(
                f"Latest Assessment: {la.get('days_ago', 0)} days ago "
                f"on {str(la.get('date', ''))[:10]}"
            )
            context_lines.append(
                f"  Voice={mods.get('voice', 0)}, "
                f"Memory={mods.get('memory', 0)}, "
                f"Tremor={mods.get('tremor', 0)}, "
                f"Typing={mods.get('typing', 0)}, "
                f"Face={mods.get('face', 0)}"
            )

        # --- Previous assessment change ---
        if context and context.get("previous_assessment"):
            pa = context["previous_assessment"]
            change = pa.get("change_from_previous", 0)
            sign = "+" if change >= 0 else ""
            context_lines.append(
                f"Change from previous assessment: {sign}{change} points"
            )

        # --- Module trends ---
        if context and context.get("module_trends"):
            context_lines.append("Module Trends:")
            for key, t in context["module_trends"].items():
                context_lines.append(
                    f"  {key.upper()}: latest={t.get('latest', 0)}, "
                    f"baseline={t.get('baseline', 0)}, "
                    f"delta={t.get('delta_from_baseline', 0):+.1f} "
                    f"({t.get('delta_pct_from_baseline', 0):+.1f}%), "
                    f"trend={t.get('trend_direction', 'stable')}, "
                    f"data_points={t.get('data_points', 0)}, "
                    f"range=[{t.get('lowest', 0)}-{t.get('highest', 0)}]"
                )

        # --- Weekly comparison ---
        if context and context.get("weekly_comparison"):
            wc = context["weekly_comparison"]
            if wc.get("this_week_count", 0) > 0 or wc.get("last_week_count", 0) > 0:
                context_lines.append(
                    f"This week: {wc.get('this_week_count', 0)} assessments, "
                    f"avg={wc.get('this_week_avg', 0)} | "
                    f"Last week: {wc.get('last_week_count', 0)} assessments, "
                    f"avg={wc.get('last_week_avg', 0)} | "
                    f"Change: {wc.get('change', 0):+.1f}"
                )

        # --- Monthly comparison ---
        if context and context.get("monthly_comparison"):
            mc = context["monthly_comparison"]
            if mc.get("this_month_count", 0) > 0 or mc.get("last_month_count", 0) > 0:
                context_lines.append(
                    f"This month: {mc.get('this_month_count', 0)} assessments, "
                    f"avg={mc.get('this_month_avg', 0)} | "
                    f"Last month: {mc.get('last_month_count', 0)} assessments, "
                    f"avg={mc.get('last_month_avg', 0)} | "
                    f"Change: {mc.get('change', 0):+.1f}"
                )

        # --- Streak ---
        if context and context.get("streak_days", 0) > 0:
            context_lines.append(f"Assessment streak: {context['streak_days']} days")

        # --- Module explanations ---
        if context and context.get("module_explanations"):
            context_lines.append("Module Reference (for explanation questions):")
            for key, exp in context["module_explanations"].items():
                context_lines.append(
                    f"  {key.upper()}: measures {exp.get('measures', '')}. "
                    f"Healthy range: {exp.get('healthy_range', '')}."
                )

        # --- Total assessments ---
        if context and context.get("total_assessments"):
            context_lines.append(f"Total assessments completed: {context['total_assessments']}")

        # ===== XAI FEATURE ATTRIBUTIONS (polarity-corrected) =====
        xai = (context or {}).get("xai_explanations", {})
        if xai:
            context_lines.append("")
            context_lines.append("=== XAI FEATURE ATTRIBUTIONS (POLARITY-CORRECTED) ===")
            context_lines.append("Sign convention: (+) helps score, (-) hurts score.")
            for module, data in xai.items():
                method = data.get("method", "unknown")
                polarity = data.get("polarity", "regressor_direct")
                context_lines.append(f"  [{module.upper()}] method={method}, polarity={polarity}")
                for f in data.get("top_positive", []):
                    reason = f" — {f['reason']}" if f.get("reason") else ""
                    context_lines.append(
                        f"    (+) {f['feature']} (value={f.get('value')}): "
                        f"+{f['contribution']}{reason}"
                    )
                for f in data.get("top_negative", []):
                    reason = f" — {f['reason']}" if f.get("reason") else ""
                    context_lines.append(
                        f"    (-) {f['feature']} (value={f.get('value')}): "
                        f"{f['contribution']}{reason}"
                    )
            context_lines.append("=== END XAI ATTRIBUTIONS ===")

        context_block = "\n".join(context_lines) if context_lines else "(No user data available yet)"
        final_prompt = (
            f"{instructions}\n\n"
            f"=== CONTEXT DATA ===\n"
            f"{context_block}\n"
            f"=== END CONTEXT ===\n\n"
            f"User message: {message}"
        )

        return final_prompt

    # ============================================================
    # GEMINI CALL
    # ============================================================
    async def _call_gemini(self, prompt: str, language: str, retries: int = 2) -> Optional[str]:
        import asyncio

        for attempt in range(retries + 1):
            try:
                logger.info(f"Sending to Gemini [{language}]: {prompt[:80]}...")
                response = self.chat.send_message(prompt)
                cleaned = self._clean_response(response.text)
                return cleaned
            except Exception as e:
                error_str = str(e)

                if "429" in error_str or "quota" in error_str.lower():
                    if attempt < retries:
                        wait_time = 2.0
                        if "retry in" in error_str.lower():
                            try:
                                match = re.search(r'retry in ([\d.]+)s', error_str)
                                if match:
                                    wait_time = float(match.group(1)) + 0.5
                            except Exception:
                                pass
                        logger.warning(
                            f"⚠️ Rate limit hit (attempt {attempt + 1}/{retries + 1}). "
                            f"Retrying in {wait_time:.1f}s..."
                        )
                        await asyncio.sleep(wait_time)
                        continue

                logger.error(f"Gemini API error: {e}")
                raise

        return None

    # ============================================================
    # RESPONSE CLEANER
    # ============================================================
    def _clean_response(self, text: str) -> str:
        if not text:
            return ""

        text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
        text = re.sub(r'\*([^*]+)\*', r'\1', text)
        text = re.sub(r'__([^_]+)__', r'\1', text)
        text = re.sub(r'_([^_]+)_', r'\1', text)
        text = re.sub(r'```[\s\S]*?```', '', text)
        text = re.sub(r'`([^`]+)`', r'\1', text)
        text = re.sub(r'^[\s]*[-•*]\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^[\s]*\d+\.\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = re.sub(r' +', ' ', text)

        return text.strip()

    # ============================================================
    # FALLBACK (context-aware)
    # ============================================================
    def _get_fallback_response(
        self,
        message: str,
        context: Optional[Dict],
        user: Optional[Any],
        language: str,
    ) -> str:
        msg = message.lower()

        user_name = "there"
        if user:
            user_name = getattr(user, "name", None) or (
                user.get("name") if isinstance(user, dict) else "there"
            )

        latest = context.get("latest_assessment") if context else None
        trends = context.get("module_trends") if context else {}
        overall = context.get("overall_status") if context else {}
        weekly = context.get("weekly_comparison") if context else {}
        monthly = context.get("monthly_comparison") if context else {}
        total = context.get("total_assessments", 0) if context else 0
        streak = context.get("streak_days", 0) if context else 0
        explanations = context.get("module_explanations", {}) if context else {}
        xai = context.get("xai_explanations", {}) if context else {}

        L = {
            "en": {
                "last_test": "Your last assessment was {days} day(s) ago on {date}. Your Brain Health Score was {score}/100.",
                "last_test_none": "You haven't completed any assessments yet. Start your first one to get personalized insights.",
                "voice": "Your latest voice score is {score} (baseline {baseline}). Trend: {trend}.",
                "memory": "Your latest memory score is {score} (baseline {baseline}). Trend: {trend}.",
                "tremor": "Your latest tremor score is {score} (baseline {baseline}). Trend: {trend}.",
                "typing": "Your latest typing score is {score} (baseline {baseline}). Trend: {trend}.",
                "face": "Your latest face score is {score} (baseline {baseline}). Trend: {trend}.",
                "overall": "Hi {name}, your overall Brain Health is {score}/100 ({level}). {desc} You've completed {total} assessments.",
                "explain_module": "{module} measures {measures}. Your current score is {score} (baseline {baseline}, trend: {trend}). Healthy range: {range}.",
                "weekly": "This week you did {this_count} assessments (avg {this_avg}), last week {last_count} (avg {last_avg}). Change: {change}.",
                "greeting": "Hello {name}! I'm your NeuroTwin AI Assistant. Your current Brain Health is {score}/100. How can I help you today?",
                "default": "Hi {name}, your current Brain Health is {score}/100. I can tell you about your voice, memory, tremor, typing, or face modules — just ask!",
            },
            "hi": {
                "last_test": "आपका अंतिम मूल्यांकन {days} दिन पहले {date} को हुआ था। आपका ब्रेन हेल्थ स्कोर {score}/100 था।",
                "last_test_none": "आपने अभी तक कोई मूल्यांकन पूरा नहीं किया है। पहला मूल्यांकन पूरा करें।",
                "voice": "आपका नवीनतम वॉइस स्कोर {score} है (बेसलाइन {baseline})। रुझान: {trend}।",
                "memory": "आपका नवीनतम मेमोरी स्कोर {score} है (बेसलाइन {baseline})। रुझान: {trend}।",
                "tremor": "आपका नवीनतम ट्रेमर स्कोर {score} है (बेसलाइन {baseline})। रुझान: {trend}।",
                "typing": "आपका नवीनतम टाइपिंग स्कोर {score} है (बेसलाइन {baseline})। रुझान: {trend}।",
                "face": "आपका नवीनतम फेस स्कोर {score} है (बेसलाइन {baseline})। रुझान: {trend}।",
                "overall": "नमस्ते {name}, आपका समग्र ब्रेन हेल्थ {score}/100 ({level}) है। {desc} आपने अब तक {total} मूल्यांकन पूरे किए हैं।",
                "explain_module": "{module} {measures} को मापता है। आपका वर्तमान स्कोर {score} है। स्वस्थ सीमा: {range}।",
                "weekly": "इस सप्ताह {this_count} मूल्यांकन (औसत {this_avg}), पिछले सप्ताह {last_count} (औसत {last_avg})।",
                "greeting": "नमस्ते {name}! मैं आपका न्यूरोट्विन AI सहायक हूं। आपका वर्तमान ब्रेन हेल्थ {score}/100 है। कैसे मदद कर सकता हूं?",
                "default": "नमस्ते {name}, आपका वर्तमान ब्रेन हेल्थ स्कोर {score}/100 है। आप वॉइस, मेमोरी, ट्रेमर, टाइपिंग या फेस के बारे में पूछ सकते हैं।",
            },
            "gu": {
                "last_test": "તમારું છેલ્લું મૂલ્યાંકન {days} દિવસ પહેલા {date} ના રોજ હતું. તમારો બ્રેન હેલ્થ સ્કોર {score}/100 હતો.",
                "last_test_none": "તમે હજી સુધી કોઈ મૂલ્યાંકન પૂર્ણ કર્યું નથી.",
                "voice": "તમારો નવીનતમ વોઇસ સ્કોર {score} છે (બેઝલાઇન {baseline}). વલણ: {trend}.",
                "memory": "તમારો નવીનતમ મેમરી સ્કોર {score} છે (બેઝલાઇન {baseline}). વલણ: {trend}.",
                "tremor": "તમારો નવીનતમ ટ્રેમર સ્કોર {score} છે (બેઝલાઇન {baseline}). વલણ: {trend}.",
                "typing": "તમારો નવીનતમ ટાઇપિંગ સ્કોર {score} છે (બેઝલાઇન {baseline}). વલણ: {trend}.",
                "face": "તમારો નવીનતમ ફેસ સ્કોર {score} છે (બેઝલાઇન {baseline}). વલણ: {trend}.",
                "overall": "નમસ્તે {name}, તમારું એકંદર બ્રેન હેલ્થ {score}/100 ({level}) છે. {desc} તમે અત્યાર સુધી {total} મૂલ્યાંકન પૂર્ણ કર્યાં છે.",
                "explain_module": "{module} {measures} ને માપે છે. તમારો વર્તમાન સ્કોર {score} છે. સ્વસ્થ શ્રેણી: {range}.",
                "weekly": "આ અઠવાડિયે {this_count} મૂલ્યાંકન (સરેરાશ {this_avg}), ગયા અઠવાડિયે {last_count} (સરેરાશ {last_avg}).",
                "greeting": "નમસ્તે {name}! હું તમારો ન્યુરોટ્રિન AI સહાયક છું. તમારું વર્તમાન બ્રેન હેલ્થ {score}/100 છે. કેવી રીતે મદદ કરી શકું?",
                "default": "નમસ્તે {name}, તમારો વર્તમાન બ્રેન હેલ્થ સ્કોર {score}/100 છે. તમે વોઇસ, મેમરી, ટ્રેમર, ટાઇપિંગ કે ફેસ વિશે પૂછી શકો છો.",
            },
        }

        lang = language.lower()[:2] if language else "en"
        if lang not in L:
            lang = "en"
        t = L[lang]

        # 1) Greeting
        if any(w in msg for w in ["hello", "hi", "hey", "namaste", "નમસ્તે", "नमस्ते"]):
            if overall and latest:
                return t["greeting"].format(
                    name=user_name,
                    score=overall.get("score", 0),
                )

        # 2) Last test date
        if any(w in msg for w in [
            "last test", "last assessment", "when did", "when was",
            "अंतिम", "पिछला", "છેલ્લું", "ક્યારે",
        ]):
            if latest:
                date_str = str(latest.get("date", ""))[:10]
                return t["last_test"].format(
                    days=latest.get("days_ago", 0),
                    date=date_str,
                    score=latest.get("brain_health_score", 0),
                )
            return t["last_test_none"]

        # 3) Module keywords
        module_map = {
            "voice": ["voice", "speech", "vocal", "आवाज़", "અવાજ", "વોઇસ"],
            "memory": ["memory", "recall", "remember", "याद", "યાદ", "મેમરી"],
            "tremor": ["tremor", "hand", "shake", "कंपन", "ધ્રુજારો", "ટ્રેમર"],
            "typing": ["typing", "type", "keyboard", "टाइपिंग", "ટાઇપિંગ"],
            "face": ["face", "expression", "facial", "चेहरा", "ચહેરો", "ફેસ"],
        }

        matched_module = None
        for mod, keywords in module_map.items():
            if any(kw in msg for kw in keywords):
                matched_module = mod
                break

        # 4) Why / Explain questions → use XAI attributions (already polarity-corrected)
        is_why = any(w in msg for w in [
            "why", "what is driving", "what's driving", "explain",
            "क्यों", "क्या कारण", "समझाएं", "કેમ", "કારણ", "સમજાવો",
        ])

        if is_why and matched_module and matched_module in xai:
            data = xai[matched_module]
            lines = []
            if lang == "en":
                lines.append(f"Your {matched_module} score is affected by these factors:")
            elif lang == "hi":
                lines.append(f"आपका {matched_module} स्कोर इन कारणों से प्रभावित है:")
            else:
                lines.append(f"તમારો {matched_module} સ્કોર આ કારણોથી પ્રભાવિત છે:")

            for f in data.get("top_positive", [])[:3]:
                reason = f.get("reason") or f.get("feature")
                lines.append(f"  Helping: {reason} (+{f['contribution']})")
            for f in data.get("top_negative", [])[:3]:
                reason = f.get("reason") or f.get("feature")
                lines.append(f"  Hurting: {reason} ({f['contribution']})")

            if len(lines) > 1:
                return "\n".join(lines)

        # 5) Explain module
        if any(w in msg for w in ["what is", "explain", "meaning", "क्या है", "समझाएं", "શું છે", "સમજાવો"]):
            if matched_module and matched_module in explanations:
                exp = explanations[matched_module]
                mod_trend = trends.get(matched_module, {})
                return t["explain_module"].format(
                    module=exp.get("name", matched_module),
                    measures=exp.get("measures", ""),
                    score=mod_trend.get("latest", 0),
                    baseline=mod_trend.get("baseline", 0),
                    trend=mod_trend.get("trend_direction", "stable"),
                    range=exp.get("healthy_range", ""),
                )

        # 6) Specific module trend
        if matched_module:
            mod_trend = trends.get(matched_module, {})
            if mod_trend:
                key = matched_module if matched_module in t else "voice"
                return t[key].format(
                    score=mod_trend.get("latest", 0),
                    baseline=mod_trend.get("baseline", 0),
                    trend=mod_trend.get("trend_direction", "stable"),
                )

        # 7) Weekly comparison
        if any(w in msg for w in ["week", "सप्ताह", "અઠવાડિયું"]):
            if weekly:
                return t["weekly"].format(
                    this_count=weekly.get("this_week_count", 0),
                    this_avg=weekly.get("this_week_avg", 0),
                    last_count=weekly.get("last_week_count", 0),
                    last_avg=weekly.get("last_week_avg", 0),
                    change=weekly.get("change", 0),
                )

        # 8) Score / change questions → use overall
        if any(w in msg for w in ["score", "change", "improve", "स्कोर", "સ્કોર"]):
            if overall and latest:
                return t["overall"].format(
                    name=user_name,
                    score=overall.get("score", 0),
                    level=overall.get("level", "stable"),
                    desc=overall.get("description", ""),
                    total=total,
                )

        # 9) Default
        if overall and latest:
            return t["default"].format(
                name=user_name,
                score=overall.get("score", 0),
            )

        return t["last_test_none"]

    # ============================================================
    # SUGGESTIONS
    # ============================================================
    def _get_suggestions(self, language: str, context: Optional[Dict] = None) -> list:
        weak_module = None
        if context and context.get("module_trends"):
            trends = context["module_trends"]
            valid_trends = {k: v for k, v in trends.items() if v.get("latest", 0) > 0}
            if valid_trends:
                weak_module = min(valid_trends.items(), key=lambda x: x[1]["latest"])[0]

        suggestions = {
            "en": {
                "weak": [
                    f"Why is my {weak_module} score low?",
                    f"How can I improve my {weak_module}?",
                    "Show me my weekly comparison",
                ],
                "default": [
                    "When was my last test?",
                    "Is my voice improving?",
                    "What does the tremor score mean?",
                ],
            },
            "hi": {
                "weak": [
                    f"मेरा {weak_module} स्कोर कम क्यों है?",
                    f"{weak_module} कैसे सुधारें?",
                    "मेरी साप्ताहिक तुलना दिखाएं",
                ],
                "default": [
                    "मेरा अंतिम मूल्यांकन कब था?",
                    "क्या मेरी आवाज़ सुधर रही है?",
                    "ट्रेमर स्कोर का क्या अर्थ है?",
                ],
            },
            "gu": {
                "weak": [
                    f"મારો {weak_module} સ્કોર ઓછો કેમ છે?",
                    f"{weak_module} કેવી રીતે સુધારવો?",
                    "મારી સાપ્તાહિક તુલના બતાવો",
                ],
                "default": [
                    "મારું છેલ્લું મૂલ્યાંકન ક્યારે હતું?",
                    "શું મારો અવાજ સુધરી રહ્યો છે?",
                    "ટ્રેમર સ્કોરનો અર્થ શું છે?",
                ],
            },
        }

        lang = language.lower()[:2] if language else "en"
        if lang not in suggestions:
            lang = "en"

        if weak_module:
            return suggestions[lang]["weak"]
        return suggestions[lang]["default"]