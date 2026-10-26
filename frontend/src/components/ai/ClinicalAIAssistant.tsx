import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiCpu, FiSend, FiUser, FiChevronDown,
  FiChevronUp, FiActivity, FiAlertCircle, FiCheckCircle,
} from 'react-icons/fi';

type ChatMessage = {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  insight?: {
    title: string;
    action: string;
  };
  recommendation?: string;
};

const ClinicalAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello Alex. I\'ve completed the analysis of your metrics from the last 24 hours. Your **Cognitive Load Index** remains stable, but I\'ve detected a subtle shift in your **Prosody (Voice)** patterns during this morning\'s assessment.',
      time: 'Just now',
      insight: {
        title: 'Micro-hesitations increased by 4.2%',
        action: 'Schedule Memory Refresh at 2 PM'
      }
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const metrics = [
    { label: 'VOICE', value: '-4.2%', status: 'warning', icon: FiActivity },
    { label: 'TREMOR', value: '+0.8%', status: 'info', icon: FiActivity },
    { label: 'MEMORY', value: '88.0', status: 'success', icon: FiCheckCircle },
    { label: 'TYPING', value: '94.2', status: 'success', icon: FiActivity },
  ];

  const quickActions = [
    'Explain my recent voice changes',
    'Show me my yearly memory trend',
    'What mitigation strategies do you recommend?',
    'Schedule Memory Refresh'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: input,
      time: 'Just now'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = `Clinically, there is a moderate correlation (r=0.62) between the motor-control shift in your typing pattern (tremor proxy) and the pitch variance in your speech today. Both suggest a slight elevation in cerebellar activity.

It's worth noting that your **Sleep Quality** was 15% lower than your 7-day baseline last night. This is the most likely primary driver for these temporary variances.`;

      const aiMessage: ChatMessage = {
        id: messages.length + 2,
        sender: 'ai',
        text: response,
        time: 'Just now',
        recommendation: 'Restorative Sleep Hygiene Protocol'
      };

      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    }, 2000);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FiCpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Clinical AI Assistant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your personalized guide to neurological health data
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
            {metrics.map((metric, idx) => (
              <div key={idx} className="text-center p-2 bg-white dark:bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className={`font-bold text-lg ${
                  metric.status === 'warning' ? 'text-amber-500' :
                  metric.status === 'success' ? 'text-emerald-500' :
                  'text-indigo-500'
                }`}>
                  {metric.value}
                </p>
                <p className="text-xs text-slate-400">{metric.status === 'warning' ? '⚠️ Warning' : '✅ Normal'}</p>
              </div>
            ))}
          </div>

          {/* Messages */}
          <div className="h-[300px] overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-3 ${
                  message.sender === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-purple-600 text-white'
                }`}>
                  {message.sender === 'user' ? <FiUser className="w-4 h-4" /> : <FiCpu className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-xl ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </p>
                    {message.insight && (
                      <div className="mt-2 p-2 bg-amber-500/20 dark:bg-amber-500/10 rounded-lg border border-amber-500/30">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <FiAlertCircle className="w-3 h-3" /> INSIGHT
                        </p>
                        <p className="text-sm">{message.insight.title}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          RECOMMENDATION: {message.insight.action}
                        </p>
                      </div>
                    )}
                    {message.recommendation && (
                      <div className="mt-2 p-2 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active Mitigation</p>
                        <p className="text-sm">{message.recommendation}</p>
                        <button className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                          VIEW FULL PROTOCOL →
                        </button>
                      </div>
                    )}
                  </div>
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
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Session Context */}
          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Session Context • Current core metrics being analyzed</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <p className="text-xs text-slate-400">VOICE</p>
                <p className="text-sm font-bold text-amber-500">-4.2%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">TREMOR</p>
                <p className="text-sm font-bold text-blue-500">+0.8%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">MEMORY</p>
                <p className="text-sm font-bold text-emerald-500">88.0</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">TYPING</p>
                <p className="text-sm font-bold text-emerald-500">94.2</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action)}
                  className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 rounded-full transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your clinical twin a question..."
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                rows={1}
                style={{ maxHeight: '100px' }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-slate-400 text-white rounded-xl transition-all flex-shrink-0 shadow-lg shadow-indigo-500/20"
              >
                <FiSend className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Powered by Clinical AI • Responses are based on your digital twin data
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ClinicalAIAssistant;