// frontend/src/components/tests/FaceTest/FaceResult.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';

interface FaceResultData {
  emotion: string;
  score: number;
  confidence: number;
  all_predictions?: Record<string, number>;
  facial_metrics: {
    smile_intensity: number;
    facial_symmetry: number;
    blink_rate: number;
    eye_movement: number;
    facial_muscle_activity: number;
    mouth_openness?: number;
    eyebrow_position?: number;
    head_tilt?: number;
    skin_tone?: number;
    wrinkle_intensity?: number;
  };
  assessment_id?: number;
}

interface FaceResultProps {
  result: FaceResultData;
  onReset?: () => void;
}

const FaceResult: React.FC<FaceResultProps> = ({ result, onReset }) => {
  const metrics = result.facial_metrics;

  const getEmotionColor = (emotion: string) => {
    switch(emotion) {
      case 'happy': return 'text-emerald-600 dark:text-emerald-400';
      case 'neutral': return 'text-slate-600 dark:text-slate-400';
      case 'sad': return 'text-blue-600 dark:text-blue-400';
      case 'angry': return 'text-red-600 dark:text-red-400';
      case 'surprise': return 'text-yellow-600 dark:text-yellow-400';
      case 'fear': return 'text-purple-600 dark:text-purple-400';
      case 'disgust': return 'text-green-600 dark:text-green-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/30';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/30';
    return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* ===== MAIN SCORE CARD (Like TremorCamera) ===== */}
      <div className={`p-5 rounded-2xl border-2 ${getStatusBg(result.score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Detected Emotion
            </p>
            <p className={`text-4xl font-bold ${getEmotionColor(result.emotion)}`}>
              {result.emotion.charAt(0).toUpperCase() + result.emotion.slice(1)}
            </p>
            <p className={`text-2xl font-bold ${getStatusColor(result.score)}`}>
              {Math.round(result.score)}/100
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center">
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                  {Math.round(result.confidence)}%
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Confidence</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== EMOTION DISTRIBUTION (Keep this - it's the graph) ===== */}
      {result.all_predictions && Object.keys(result.all_predictions).length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            📊 Emotion Distribution
          </h4>
          <div className="space-y-2">
            {Object.entries(result.all_predictions).map(([emotion, prob]) => (
              <div key={emotion} className="flex items-center gap-3">
                <span className={`text-xs w-16 font-medium capitalize ${getEmotionColor(emotion)}`}>
                  {emotion}
                </span>
                <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getEmotionColor(emotion).replace('text-', 'bg-')}`}
                    style={{ width: `${((prob || 0) * 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="text-xs w-14 text-slate-600 dark:text-slate-400 text-right font-medium">
                  {((prob || 0) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SIMPLIFIED METRICS GRID (4 metrics like TremorCamera) ===== */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          📊 Facial Metrics
        </h4>
        <div className="grid grid-cols-4 gap-2">
          <MetricCard 
            label="Smile" 
            value={(metrics.smile_intensity || 0) * 100} 
            unit="%" 
          />
          <MetricCard 
            label="Symmetry" 
            value={metrics.facial_symmetry || 0} 
            unit="%" 
          />
          <MetricCard 
            label="Blink Rate" 
            value={metrics.blink_rate || 0} 
            unit="/min" 
          />
          <MetricCard 
            label="Muscle Activity" 
            value={metrics.facial_muscle_activity || 0} 
            unit="" 
          />
        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      {onReset && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <FiRefreshCw className="w-4 h-4" />
            New Assessment
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ===== SIMPLIFIED METRIC CARD (Like TremorCamera style) =====
interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit }) => {
  const getColor = (val: number) => {
    if (val >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-center">
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${getColor(value)}`}>
        {value.toFixed(1)}
        <span className="text-[10px] font-normal text-slate-400 ml-0.5">{unit}</span>
      </p>
    </div>
  );
};

export default FaceResult;