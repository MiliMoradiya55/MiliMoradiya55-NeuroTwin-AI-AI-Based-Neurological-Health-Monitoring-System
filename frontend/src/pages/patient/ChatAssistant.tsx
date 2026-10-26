// frontend/src/pages/patient/ChatAssistant.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiCpu, FiUser, FiRefreshCw, FiGlobe } from 'react-icons/fi';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { chatAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// ==================== TYPES ====================
type Language = 'en' | 'hi' | 'gu';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  suggestions?: string[];
}

// ==================== LANGUAGE OPTIONS ====================
const LANGUAGES: { code: Language; label: string; flag: string; greeting: string }[] = [
  {
    code: 'en',
    label: 'English',
    flag: '🇬🇧',
    greeting:
      "Hello! I'm your NeuroTwin Clinical AI Assistant. I've analyzed your Digital Brain Twin profile and I'm ready to help you understand your neurological health metrics.",
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    flag: '🇮🇳',
    greeting:
      'नमस्ते! मैं आपका न्यूरोट्विन क्लिनिकल AI सहायक हूं। मैंने आपकी डिजिटल ब्रेन ट्विन प्रोफ़ाइल का विश्लेषण किया है और आपके न्यूरोलॉजिकल स्वास्थ्य मेट्रिक्स को समझने में आपकी सहायता करने के लिए तैयार हूं।',
  },
  {
    code: 'gu',
    label: 'ગુજરાતી',
    flag: '🇮🇳',
    greeting:
      'નમસ્તે! હું તમારો ન્યુરોટ્વિન ક્લિનિકલ AI સહાયક છું. મેં તમારી ડિજિટલ બ્રેન ટ્વિન પ્રોફાઇલનું વિશ્લેષણ કર્યું છે અને તમારા ન્યુરોલોજિકલ સ્વાસ્થ્ય મેટ્રિક્સને સમજવામાં તમારી સહાય કરવા તૈયાર છું.',
  },
];

// ==================== QUICK ACTIONS PER LANGUAGE ====================
const QUICK_ACTIONS: Record<Language, string[]> = {
  en: [
    'Why did my score change?',
    'Explain my voice analysis',
    'How is my hand tremor?',
    'Generate PDF report',
  ],
  hi: [
    'मेरा स्कोर क्यों बदला?',
    'मेरी आवाज़ का विश्लेषण समझाएं',
    'मेरा हाथ कंपन कैसा है?',
    'PDF रिपोर्ट बनाएं',
  ],
  gu: [
    'મારો સ્કોર કેમ બદલાયો?',
    'મારા અવાજનું વિશ્લેષણ સમજાવો',
    'મારો હાથ ધ્રુજારો કેવો છે?',
    'PDF રિપોર્ટ બનાવો',
  ],
};

// ==================== SUBTITLE PER LANGUAGE ====================
const SUBTITLES: Record<Language, string> = {
  en: 'Grounded in your Digital Brain Twin data',
  hi: 'आपके डिजिटल ब्रेन ट्विन पर आधारित',
  gu: 'તમારા ડિજિટલ બ્રેન ટ્વિન પર આધારિત',
};

// ==================== INPUT PLACEHOLDER ====================
const PLACEHOLDERS: Record<Language, string> = {
  en: 'Ask about your brain health metrics or twin insights...',
  hi: 'अपने ब्रेन हेल्थ मेट्रिक्स के बारे में पूछें...',
  gu: 'તમારા બ્રેન હેલ્થ મેટ્રિક્સ વિશે પૂછો...',
};

// ==================== FOOTER NOTE ====================
const FOOTER_NOTES: Record<Language, string> = {
  en: 'NeuroTwin AI • For monitoring purposes only — not a clinical diagnosis tool',
  hi: 'न्यूरोट्विन AI • केवल निगरानी उद्देश्यों के लिए — नैदानिक निदान उपकरण नहीं',
  gu: 'ન્યુરોટ્વિન AI • ફક્ત મોનિટરિંગ હેતુઓ માટે — ક્લિનિકલ નિદાન સાધન નથી',
};

// ==================== MAIN COMPONENT ====================
const ChatAssistant: React.FC = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: LANGUAGES[0].greeting,
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language)!;

  // ===== AUTO SCROLL =====
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // ===== CHANGE LANGUAGE =====
  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    setShowLanguageMenu(false);

    const greeting = LANGUAGES.find((l) => l.code === lang)!.greeting;
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: greeting,
        time: 'Just now',
      },
    ]);

    try {
      await chatAPI.clearHistory();
    } catch {
      // Silent
    }

    toast.success(`Language: ${LANGUAGES.find((l) => l.code === lang)!.label}`);
  };

  // ===== SEND MESSAGE =====
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      time: 'Just now',
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await chatAPI.sendMessage(messageText, language);

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: result.text || 'No response received.',
        time: 'Just now',
        suggestions: result.suggestions || [],
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);

      const errorText =
        error.response?.data?.detail ||
        (language === 'hi'
          ? 'क्षमा करें, कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
          : language === 'gu'
          ? 'માફ કરશો, કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.'
          : 'Sorry, something went wrong. Please try again.');

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'ai',
          text: errorText,
          time: 'Just now',
        },
      ]);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleQuickAction = (action: string) => sendMessage(action);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    try {
      await chatAPI.clearHistory();
    } catch {
      // silent
    }

    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: currentLang.greeting,
        time: 'Just now',
      },
    ]);
    toast.success('Chat cleared');
  };

  // ===== DEV-ONLY: INSPECT XAI CONTEXT (silent trigger) =====
  const handleInspectContext = async () => {
    if (!user?.id) {
      toast.error('No user loaded');
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/chat/context/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await res.json();
      console.log('📊 Full XAI Context:', data.context);
      console.log('🔍 Voice XAI:', data.context?.xai_explanations?.voice);
      console.log('🔍 Typing XAI:', data.context?.xai_explanations?.typing);
      console.log('🔍 Tremor XAI:', data.context?.xai_explanations?.tremor);
      console.log('🔍 Face XAI:', data.context?.xai_explanations?.face);
      console.log('🔍 Memory XAI:', data.context?.xai_explanations?.memory);
      toast.success('Context dumped to console (F12)');
    } catch (err) {
      console.error('Inspect context error:', err);
      toast.error('Failed to fetch context');
    }
  };

  // ===== RENDER =====
  return (
    <div className="h-[calc(100vh-180px)] relative">
      {/* ===== DEV-ONLY: Silent invisible trigger for XAI context dump ===== */}
      {import.meta.env.DEV && (
        <div
          onClick={handleInspectContext}
          className="absolute top-0 right-0 w-10 h-10 z-50 cursor-pointer"
          title=""
          aria-label=""
        />
      )}

      <Card className="h-full flex flex-col">
        {/* ===== HEADER ===== */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <FiCpu className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 dark:text-white truncate">
              NeuroTwin Clinical AI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {SUBTITLES[language]}
            </p>
          </div>

          {/* ===== LANGUAGE SELECTOR ===== */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600"
              title="Change language"
            >
              <FiGlobe className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {currentLang.flag} {currentLang.label}
              </span>
            </button>

            <AnimatePresence>
              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                        language === lang.code
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.label}</span>
                      {language === lang.code && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Clear chat */}
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700 transition-all"
            title="Clear chat"
          >
            <FiRefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* ===== MESSAGES ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${
                message.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-purple-600 text-white'
                }`}
              >
                {message.sender === 'user' ? (
                  <FiUser className="w-4 h-4" />
                ) : (
                  <FiCpu className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[82%] ${
                  message.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-line ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-sm'
                  }`}
                >
                  {message.text}
                </div>

                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {message.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(s)}
                        className="text-xs px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-1">{message.time}</p>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <FiCpu className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ===== QUICK CHIPS ===== */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS[language].map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action)}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* ===== INPUT ===== */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={PLACEHOLDERS[language]}
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
              rows={1}
              style={{ maxHeight: '100px' }}
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-3 !rounded-xl flex-shrink-0"
            >
              <FiSend className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            {FOOTER_NOTES[language]}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ChatAssistant;