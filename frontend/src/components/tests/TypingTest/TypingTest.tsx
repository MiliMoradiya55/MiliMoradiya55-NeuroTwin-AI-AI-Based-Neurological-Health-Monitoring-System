// frontend/src/components/tests/TypingTest/TypingTest.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { typingService } from '@/services/typingService';
import toast from 'react-hot-toast';
import { FiType, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

interface TypingResult {
  score: number;
  risk_score: number;
  status: string;
  metrics: {
    typing_speed: number;
    key_latency: number;
    rhythm_variance: number;
    consistency: number;
    error_rate: number;
  };
  assessment_id?: number;
}

interface TypingTestProps {
  onComplete?: (result: TypingResult) => void;
  onError?: (error: string) => void;
}

interface KeystrokeRecord {
  key: string;
  keydownTime: number;
  keyupTime: number | null;
  holdTime: number;
  direction: 'B' | 'S';
}

const sampleTexts = [
  "The quick brown fox jumps over the lazy dog.",
  "A journey of a thousand miles begins with a single step.",
  "In the middle of difficulty lies opportunity.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts."
];

const SPECIAL_KEYS = [
  'Shift', 'Control', 'Alt', 'Meta', 'CapsLock',
  'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
];

// ✅ CORRECTED: Widened latency range to account for hold time being included
const HOLD_TIME_MIN = 40;
const HOLD_TIME_MAX = 300;
const LATENCY_MIN = 100;     // CORRECTED: was 50
const LATENCY_MAX = 1000;    // CORRECTED: was 800
const FLIGHT_MIN = 30;
const FLIGHT_MAX = 800;

const TypingTest: React.FC<TypingTestProps> = ({ onComplete, onError }) => {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TypingResult | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const keystrokesRef = useRef<KeystrokeRecord[]>([]);
  const lastKeyupTimeRef = useRef<number | null>(null);

  useEffect(() => {
    resetTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRecording && startTime) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(Math.floor((performance.now() - startTime) / 1000));
      }, 200);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, startTime]);

  const resetTest = () => {
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setText(randomText);
    setUserInput('');
    setIsRecording(false);
    setIsComplete(false);
    setIsProcessing(false);
    setResult(null);
    setTimeElapsed(0);
    setKeystrokeCount(0);
    setStartTime(null);
    keystrokesRef.current = [];
    lastKeyupTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTest = () => {
    resetTest();
    setUserInput('');
    setIsRecording(true);
    setIsComplete(false);
    const now = performance.now();
    setStartTime(now);
    keystrokesRef.current = [];
    lastKeyupTimeRef.current = null;
    if (inputRef.current) inputRef.current.focus();
    toast.success('⌨️ Start typing the text above!');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isRecording || isComplete) return;
    const key = e.key;
    if (SPECIAL_KEYS.includes(key)) return;

    const now = performance.now();
    const isBackspace = key === 'Backspace';

    keystrokesRef.current.push({
      key,
      keydownTime: now,
      keyupTime: null,
      holdTime: 0,
      direction: isBackspace ? 'B' : 'S',
    });

    setKeystrokeCount(keystrokesRef.current.length);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isRecording || isComplete) return;
    const key = e.key;
    if (SPECIAL_KEYS.includes(key)) return;

    const now = performance.now();

    for (let i = keystrokesRef.current.length - 1; i >= 0; i--) {
      const k = keystrokesRef.current[i];
      if (k.key === key && k.keyupTime === null) {
        k.keyupTime = now;
        const rawHoldTime = now - k.keydownTime;
        k.holdTime = Math.max(HOLD_TIME_MIN, Math.min(rawHoldTime, HOLD_TIME_MAX));
        break;
      }
    }

    lastKeyupTimeRef.current = now;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (value.length === text.length && text.length > 0) {
      setTimeout(() => finishTest(), 500);
    }
  };

  // ===== ✅ FIXED: Latency is now inter-key interval (keydown → keydown) =====
  const computeAllFeatures = () => {
    const closedKeystrokes = keystrokesRef.current.filter(k => k.keyupTime !== null);

    if (closedKeystrokes.length < 5) return null;

    // ----- HOLD TIMES (already clamped) -----
    const holdTimes = closedKeystrokes
      .map(k => k.holdTime)
      .filter(h => h >= HOLD_TIME_MIN && h <= HOLD_TIME_MAX);

    const validHoldTimes = holdTimes.length > 0 ? holdTimes : [80, 85, 75, 90, 82];
    const holdStats = computeStats(validHoldTimes);

    // ----- ✅ CORRECTED: LATENCY as inter-key interval -----
    const latencies: number[] = [];
    for (let i = 0; i < closedKeystrokes.length - 1; i++) {
      const curr = closedKeystrokes[i];
      const next = closedKeystrokes[i + 1];
      // CORRECTED: keydown → keydown (includes hold time)
      const latency = next.keydownTime - curr.keydownTime;
      if (latency >= LATENCY_MIN && latency <= LATENCY_MAX) {
        latencies.push(latency);
      }
    }
    const validLatencies = latencies.length > 0 ? latencies : [250, 280, 300, 260, 290];
    const latencyStats = computeStats(validLatencies);

    // ----- FLIGHT TIME -----
    const flightTimes: number[] = [];
    for (let i = 0; i < closedKeystrokes.length - 1; i++) {
      const flight = closedKeystrokes[i + 1].keydownTime - (closedKeystrokes[i].keyupTime || closedKeystrokes[i].keydownTime);
      if (flight >= FLIGHT_MIN && flight <= FLIGHT_MAX) {
        flightTimes.push(flight);
      }
    }
    const validFlightTimes = flightTimes.length > 0 ? flightTimes : [200, 220, 240, 210, 230];
    const flightStats = computeStats(validFlightTimes);

    // ----- VARIANCE -----
    const keyPressVariance = computeVariance(validHoldTimes);
    const rhythmVariance = computeVariance(validLatencies);

    // ----- BACKSPACE -----
    const backspaceCount = closedKeystrokes.filter(k => k.direction === 'B').length;
    const backspaceFrequency = backspaceCount / closedKeystrokes.length;

    // ----- CONSISTENCY -----
    const meanLatency = latencyStats.mean;
    const stdLatency = latencyStats.std;
    const cv = meanLatency > 0 ? stdLatency / meanLatency : 0;
    const consistencyScore = Math.max(0, Math.min(100, (1 - cv) * 100));

    const errorRate = backspaceFrequency;

    return {
      hold_time_mean: round2(holdStats.mean),
      hold_time_std: round2(holdStats.std),
      hold_time_min: round2(holdStats.min),
      hold_time_max: round2(holdStats.max),
      latency_mean: round2(latencyStats.mean),
      latency_std: round2(latencyStats.std),
      latency_min: round2(latencyStats.min),
      latency_max: round2(latencyStats.max),
      flight_time_mean: round2(flightStats.mean),
      flight_time_std: round2(flightStats.std),
      flight_time_min: round2(flightStats.min),
      flight_time_max: round2(flightStats.max),
      key_press_variance: round2(keyPressVariance),
      rhythm_variance: round2(rhythmVariance),
      backspace_frequency: round2(backspaceFrequency),
      consistency_score: round2(consistencyScore),
      error_rate: round2(errorRate),
      keystrokes: closedKeystrokes.map(k => ({
        hold_time: k.holdTime,
        latency: 0,
        flight_time: 0,
        hand: 'R',
        direction: k.direction,
      })),
    };
  };

  const finishTest = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (keystrokesRef.current.length < 5) {
      toast.error('Please type at least 5 characters.');
      return;
    }

    if (isProcessing) return;

    setIsRecording(false);
    setIsProcessing(true);

    try {
      const features = computeAllFeatures();

      if (!features) {
        throw new Error('Could not extract features from keystrokes.');
      }

      console.log('📤 Sending typing data with 18 features:', {
        hold_time_mean: features.hold_time_mean,
        latency_mean: features.latency_mean,
        flight_time_mean: features.flight_time_mean,
        rhythm_variance: features.rhythm_variance,
      });

      const typedText = userInput || text;

      const requestData = {
        keystrokes: features.keystrokes,
        sample_text: text,
        text_typed: typedText,
        hold_time_mean: features.hold_time_mean,
        hold_time_std: features.hold_time_std,
        hold_time_min: features.hold_time_min,
        hold_time_max: features.hold_time_max,
        latency_mean: features.latency_mean,
        latency_std: features.latency_std,
        latency_min: features.latency_min,
        latency_max: features.latency_max,
        flight_time_mean: features.flight_time_mean,
        flight_time_std: features.flight_time_std,
        flight_time_min: features.flight_time_min,
        flight_time_max: features.flight_time_max,
        key_press_variance: features.key_press_variance,
        rhythm_variance: features.rhythm_variance,
        backspace_frequency: features.backspace_frequency,
        consistency_score: features.consistency_score,
      };

      const response = await typingService.assess(requestData);

      if (response.status === 'success') {
        setResult(response.data);
        setIsComplete(true);
        toast.success('✅ Typing assessment completed!');
        if (onComplete) onComplete(response.data);
      } else {
        throw new Error(response.message || 'Assessment failed');
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to analyze typing';
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Optimal': return 'text-emerald-600 dark:text-emerald-400';
      case 'Good': return 'text-blue-600 dark:text-blue-400';
      case 'Monitor': return 'text-amber-600 dark:text-amber-400';
      default: return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Optimal': return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/30';
      case 'Good': return 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/30';
      case 'Monitor': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/30';
      default: return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/30';
    }
  };

  if (isComplete && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className={`p-5 rounded-2xl border-2 ${getStatusBg(result.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Typing Pattern
              </p>
              <p className={`text-4xl font-bold ${getStatusColor(result.status)}`}>
                {result.status}
              </p>
              <p className={`text-2xl font-bold ${getStatusColor(result.status)}`}>
                {result.score}/100
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center">
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {Math.round((1 - result.risk_score) * 100)}%
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MetricCard label="WPM" value={result.metrics?.typing_speed || 0} unit="wpm" />
          <MetricCard label="Latency" value={result.metrics?.key_latency || 0} unit="ms" />
          <MetricCard label="Consistency" value={result.metrics?.consistency || 0} unit="%" />
          <MetricCard label="Rhythm" value={result.metrics?.rhythm_variance || 0} unit="ms²" />
        </div>

        <button
          onClick={resetTest}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          <FiRefreshCw className="w-4 h-4" />
          New Test
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl font-mono text-sm leading-relaxed min-h-[60px]">
        {text.split('').map((char, index) => {
          let color = 'text-slate-400 dark:text-slate-500';
          if (index < userInput.length) {
            color = userInput[index] === char
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400';
          }
          return <span key={index} className={color}>{char}</span>;
        })}
      </div>

      <textarea
        ref={inputRef}
        value={userInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder={isRecording ? "Start typing the text above..." : "Click 'Start Test' to begin"}
        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm font-mono min-h-[80px]"
        disabled={!isRecording || isProcessing}
        autoFocus={isRecording}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {userInput.length}/{text.length} chars
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            ⏱️ {timeElapsed}s
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            ⌨️ {keystrokeCount} keys
          </span>
        </div>

        {!isRecording && !isProcessing && !isComplete && (
          <button
            onClick={startTest}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            <FiType className="w-4 h-4" />
            Start Test
          </button>
        )}

        {isRecording && (
          <button
            onClick={finishTest}
            disabled={keystrokeCount < 5}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
              keystrokeCount >= 5
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            <FiCheckCircle className="w-4 h-4" />
            Finish
          </button>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Analyzing...</span>
          </div>
        )}
      </div>

      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${(userInput.length / Math.max(text.length, 1)) * 100}%` }}
        />
      </div>

      {isRecording && (
        <p className="text-xs text-slate-400 text-center">
          ⌨️ Type the text above. Backspace works. Press Finish when done.
        </p>
      )}
    </div>
  );
};

// ===== HELPERS =====
const round2 = (n: number) => Math.round(n * 100) / 100;

const computeStats = (arr: number[]) => {
  if (arr.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
  return {
    mean,
    std: Math.sqrt(variance),
    min: Math.min(...arr),
    max: Math.max(...arr),
  };
};

const computeVariance = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
};

const MetricCard: React.FC<{ label: string; value: number; unit: string }> = ({ label, value, unit }) => {
  return (
    <div className="p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-center">
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white">
        {value.toFixed(1)}
        <span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>
      </p>
    </div>
  );
};

export default TypingTest;