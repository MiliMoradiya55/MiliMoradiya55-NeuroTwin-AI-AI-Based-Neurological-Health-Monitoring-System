// frontend/src/pages/patient/Assessment.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMic, FiCamera, FiSmile, FiCpu,
  FiType, FiAward, FiArrowLeft, FiArrowRight,
  FiCheckCircle, FiHome, FiLoader, FiLock
} from 'react-icons/fi';

import VoiceRecorder from '@/components/tests/VoiceTest/VoiceRecorder';
import TremorCamera from '@/components/tests/TremorTest/TremorCamera';
import FaceCamera from '@/components/tests/FaceTest/FaceCamera';
import MemoryTest from '@/components/tests/MemoryTest/WordRecall';
import TypingTest from '@/components/tests/TypingTest/TypingTest';
import FeedbackModal from '@/components/FeedbackModal';
import { feedbackAPI } from '@/services/api';

import toast from 'react-hot-toast';

// ===== INTERFACES =====
interface VoiceResult {
  score: number;
  confidence: number;
  metrics: {
    pitch: number;
    jitter: number;
    shimmer: number;
    hnr: number;
    voice_tremor: number;
    speech_rate: number;
  };
  recommendation: string;
  assessment_id?: number;
}

interface TremorResult {
  label: string;
  score: number;
  confidence: number;
  features: {
    tremor_frequency: number;
    tremor_amplitude: number;
    hand_stability: number;
    jerk: number;
    variance: number;
    range_movement: number;
    wrist_stability: number;
    wrist_movement: number;
  };
  assessment_id?: number;
}

interface FaceResult {
  emotion: string;
  score: number;
  confidence: number;
  facial_metrics: {
    smile_intensity: number;
    facial_symmetry: number;
    blink_rate: number;
    eye_movement: number;
    facial_muscle_activity: number;
  };
  assessment_id?: number;
}

interface MemoryResult {
  score: number;
  accuracy: number;
  correct_count: number;
  total_count: number;
  avg_reaction_time: number;
  total_time: number;
  memory_level: string;
  memory_quotient: number;
  recommendation: string;
  assessment_id?: number;
}

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

const Assessment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceResult | null>(null);
  const [tremorResult, setTremorResult] = useState<TremorResult | null>(null);
  const [faceResult, setFaceResult] = useState<FaceResult | null>(null);
  const [memoryResult, setMemoryResult] = useState<MemoryResult | null>(null);
  const [typingResult, setTypingResult] = useState<TypingResult | null>(null);

  // ===== ENTRY GATE STATE (NEW) =====
  const [entryGateLoading, setEntryGateLoading] = useState(true);
  const [feedbackRequired, setFeedbackRequired] = useState(false);
  const [gateState, setGateState] = useState<string>(''); // free_first | free_second | gate | free

  const steps = [
    {
      id: 'voice',
      icon: FiMic,
      label: 'Voice Analysis',
      description: 'Record your voice for vocal prosody & pitch tremor analysis',
      component: VoiceRecorder,
    },
    {
      id: 'tremor',
      icon: FiCamera,
      label: 'Hand Tremor Test',
      description: 'Record video for hand oscillation tracking',
      component: TremorCamera,
    },
    {
      id: 'face',
      icon: FiSmile,
      label: 'Facial Movement',
      description: 'Facial micro-expression & symmetry analysis',
      component: FaceCamera,
    },
    {
      id: 'memory',
      icon: FiCpu,
      label: 'Memory Recall',
      description: 'Evaluate sequence recall and accuracy',
      component: MemoryTest,
    },
    {
      id: 'typing',
      icon: FiType,
      label: 'Typing Pattern',
      description: 'Assess keystroke latency and rhythm variance',
      component: TypingTest,
    },
  ];

  // ===== GET USER ID =====
  const getUserId = (): number => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      return userData.id || 1;
    } catch {
      return 1;
    }
  };

  // ============================================================
  // ENTRY GATE CHECK — runs on page mount
  // ============================================================
  useEffect(() => {
    const checkEntryGate = async () => {
      const userId = getUserId();
      setEntryGateLoading(true);
      try {
        const res = await feedbackAPI.getStatus(userId);

        if (res.status === 'success' && res.data) {
          const state = res.data.state;
          setGateState(state);

          if (res.data.next_assessment_requires_feedback) {
            // Block the assessment — user must submit feedback first
            setFeedbackRequired(true);
            return;
          }

          // Show contextual toast based on state
          if (state === 'free_second') {
            toast(
              'ℹ️ This is your 2nd free assessment this week. After this, feedback will be required.',
              { duration: 5000 }
            );
          }
        }
      } catch (err) {
        console.error('Entry gate check failed:', err);
        // Fail-open: allow the assessment if the check itself fails
      } finally {
        setEntryGateLoading(false);
      }
    };

    checkEntryGate();
  }, []);

  // ============================================================
  // FEEDBACK SUBMITTED AT ENTRY → unlock the assessment
  // ============================================================
  const handleEntryFeedbackSubmitted = () => {
    setFeedbackRequired(false);
    setGateState('free');
    toast.success('✅ Thank you! You can now start your assessment.');
  };

  // ============================================================
  // FEEDBACK MODAL CANCEL (from within the entry gate) → go back
  // ============================================================
  const handleEntryFeedbackCancel = () => {
    window.location.href = '/patient/dashboard';
  };

  // ============================================================
  // FINISH CLICK — save batch (gate already checked at entry)
  // ============================================================
  const handleFinishClick = async () => {
    setCompleted(true);
    toast.success('🎉 Weekly Assessment completed successfully!');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinishClick();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleVoiceComplete = (result: VoiceResult) => {
    setVoiceResult(result);
    toast.success('🎤 Voice assessment completed!');
  };

  const handleTremorComplete = (result: TremorResult) => {
    setTremorResult(result);
    toast.success('🖐️ Tremor assessment completed!');
  };

  const handleFaceComplete = (result: FaceResult) => {
    setFaceResult(result);
    toast.success('😊 Face assessment completed!');
  };

  const handleMemoryComplete = (result: MemoryResult) => {
    setMemoryResult(result);
    toast.success('🧠 Memory assessment completed!');
  };

  const handleTypingComplete = (result: TypingResult) => {
    setTypingResult(result);
    toast.success('⌨️ Typing assessment completed!');
  };

  const renderStepContent = () => {
    const step = steps[currentStep];
    switch (step.id) {
      case 'voice':
        return <VoiceRecorder onComplete={handleVoiceComplete} onError={(err) => toast.error(err)} />;
      case 'tremor':
        return <TremorCamera onComplete={handleTremorComplete} onError={(err) => toast.error(err)} />;
      case 'face':
        return <FaceCamera onComplete={handleFaceComplete} onError={(err) => toast.error(err)} />;
      case 'memory':
        return <MemoryTest onComplete={handleMemoryComplete} onError={(err) => toast.error(err)} />;
      case 'typing':
        return <TypingTest onComplete={handleTypingComplete} onError={(err) => toast.error(err)} />;
      default:
        return null;
    }
  };

  const isStepComplete = (index: number) => {
    if (index < currentStep) return true;
    if (index === currentStep) {
      switch (steps[index].id) {
        case 'voice':
          return !!voiceResult;
        case 'tremor':
          return !!tremorResult;
        case 'face':
          return !!faceResult;
        case 'memory':
          return !!memoryResult;
        case 'typing':
          return !!typingResult;
        default:
          return false;
      }
    }
    return false;
  };

  // ============================================================
  // ENTRY GATE: LOADING
  // ============================================================
  if (entryGateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="relative mx-auto">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800/30 rounded-full" />
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
            Checking your assessment eligibility...
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ENTRY GATE: FEEDBACK REQUIRED (blocking view)
  // ============================================================
  if (feedbackRequired) {
    return (
      <div className="space-y-6">
        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-900/20 dark:to-rose-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800/40"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <FiLock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Feedback Required to Continue
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                You've completed 2 assessments this week. To unlock unlimited
                assessments until the end of the week, please share your
                feedback first — it takes less than a minute.
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                <FiCheckCircle className="w-3.5 h-3.5" />
                <span>After submitting, the assessment will unlock automatically.</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inline feedback form — blocking */}
        <FeedbackModal
          userId={getUserId()}
          isOpen={true}
          onClose={handleEntryFeedbackCancel}
          onSubmitted={handleEntryFeedbackSubmitted}
          inline={true}
          blockCancel={true}
        />
      </div>
    );
  }

  // ============================================================
  // COMPLETED SCREEN
  // ============================================================
  if (completed) {
    const scores = [
      voiceResult?.score || 0,
      tremorResult?.score || 0,
      faceResult?.score || 0,
      memoryResult?.score || 0,
      typingResult?.score || 0,
    ];
    const completedModules = scores.filter((s) => s > 0).length;
    const overallScore =
      completedModules > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / completedModules)
        : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700"
      >
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Weekly Assessment Complete!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Your Digital Brain Twin has updated your longitudinal baseline profile.
        </p>

        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
            <FiAward className="w-6 h-6" />
            <span className="text-3xl font-extrabold">{overallScore} / 100</span>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
            {overallScore >= 80
              ? '🌟 Optimal Resilience'
              : overallScore >= 60
              ? '📊 Moderate Performance'
              : '⚠️ Needs Attention'}
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            {voiceResult && (
              <span className="px-3 py-1 bg-white/50 dark:bg-slate-700/50 rounded-full">
                🎤 Voice: {Math.round(voiceResult.score)}/100
              </span>
            )}
            {tremorResult && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                🖐️ Tremor: {tremorResult.label} ({Math.round(tremorResult.score)}/100)
              </span>
            )}
            {faceResult && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                😊 Face: {faceResult.emotion} ({Math.round(faceResult.score)}/100)
              </span>
            )}
            {memoryResult && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                🧠 Memory: {memoryResult.memory_level} ({Math.round(memoryResult.score)}/100)
              </span>
            )}
            {typingResult && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                ⌨️ Typing: {typingResult.status} ({Math.round(typingResult.score)}/100)
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/patient/dashboard')}
          className="mt-6 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 mx-auto"
        >
          <FiHome className="w-4 h-4" />
          Return to Patient Dashboard
        </button>
      </motion.div>
    );
  }

  // ============================================================
  // IN-PROGRESS VIEW (normal assessment flow)
  // ============================================================
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Assessment Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isStepComplete(index)
                    ? 'bg-emerald-500 text-white'
                    : index === currentStep
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-800/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {isStepComplete(index) ? '✓' : index + 1}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 hidden sm:block">
                {step.label.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Header */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
          {React.createElement(steps[currentStep].icon, { className: 'w-6 h-6' })}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {steps[currentStep].label}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {steps[currentStep].description}
          </p>
        </div>
        {isStepComplete(currentStep) && (
          <span className="ml-auto text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
            <FiCheckCircle className="w-3 h-3" />
            Done
          </span>
        )}
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[320px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Previous Step
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNext}
            disabled={!isStepComplete(currentStep)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
              isStepComplete(currentStep)
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            {currentStep === steps.length - 1
              ? 'Finish & Save Twin Profile'
              : 'Next Step'}
            {currentStep < steps.length - 1 && (
              <FiArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assessment;