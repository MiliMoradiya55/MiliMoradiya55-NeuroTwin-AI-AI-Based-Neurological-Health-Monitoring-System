// frontend/src/components/SHAPExplanation.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiInfo, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';
import api from '@/services/api';

// ============ TYPES ============
interface SHAPFeature {
  feature: string;
  value: number | string;   // ✅ Support string values (e.g. "happy", "hard")
  shap_value: number;
  abs_shap: number;
  direction: 'positive' | 'negative';
  reason?: string;          // ✅ Rule-based branch reason
}

interface SHAPExplanationData {
  method: string;
  base_value?: number;
  prediction?: number;
  features: SHAPFeature[];
  top_positive?: SHAPFeature[];
  top_negative?: SHAPFeature[];
  total_positive?: number;
  total_negative?: number;
  error?: string;
  reason?: string;
  note?: string;            // ✅ Rule-based note
}

interface Props {
  userId: number;
  module: 'voice' | 'tremor' | 'typing' | 'memory' | 'face';
  moduleColor?: string;
}

// ============ ALL MODULES NOW SUPPORTED ============
const SHAP_MODULES = ['voice', 'tremor', 'typing', 'memory', 'face'];

// ============ SMART SHAP VALUE FORMATTER ============
function formatShapValue(value: number): string {
  if (value === 0) return '0';
  const sign = value > 0 ? '+' : '-';
  const abs = Math.abs(value);

  if (abs >= 1) return `${sign}${abs.toFixed(2)}`;
  if (abs >= 0.01) return `${sign}${abs.toFixed(3)}`;
  return `${sign}${abs.toExponential(2)}`;
}

// ============ METHOD LABEL PRETTY-PRINTER ============
function prettyMethod(method: string): string {
  switch (method) {
    case 'RuleBasedAttribution':
      return 'Rule-Based';
    case 'TreeExplainer':
      return 'SHAP (Tree)';
    case 'DeepExplainer':
    case 'GradientExplainer':
      return `SHAP (${method.replace('Explainer', '')})`;
    default:
      return method;
  }
}

// ============ COMPONENT ============
const SHAPExplanation: React.FC<Props> = ({ userId, module, moduleColor = '#6366f1' }) => {
  const [explanation, setExplanation] = useState<SHAPExplanationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupported = SHAP_MODULES.includes(module.toLowerCase());

  useEffect(() => {
    if (!userId || !isSupported) {
      setLoading(false);
      return;
    }

    const fetchExplanation = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await api.get(`/timeline/shap-explain/${userId}/${module}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.status === 'success') {
          setExplanation(res.data.explanation);
        } else {
          setError('Failed to load explanation');
        }
      } catch (err: any) {
        console.error('Explainability fetch error:', err);
        setError(err.response?.data?.detail || 'Failed to load explanation');
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [userId, module, isSupported]);

  if (!isSupported) return null;

  if (loading) {
    return (
      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Computing explanation...
        </div>
      </div>
    );
  }

  if (
    error ||
    !explanation ||
    explanation.method === 'unavailable' ||
    explanation.method === 'no_data' ||
    explanation.method === 'no_features'
  ) {
    return (
      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
        <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <FiAlertCircle className="w-3 h-3 flex-shrink-0" />
          Explanation unavailable: {explanation?.reason || error || 'Not supported for this assessment'}
        </p>
      </div>
    );
  }

  const features = explanation.features || [];
  if (features.length === 0) return null;

  const topFeatures = features.slice(0, 8);
  const maxAbsShap = Math.max(...topFeatures.map((f) => f.abs_shap), 0.00001);

  const isRuleBased = explanation.method === 'RuleBasedAttribution';
  const isClassifierOutput = explanation.method === 'TreeExplainer';
  const isRegressionOutput =
    explanation.method === 'DeepExplainer' ||
    explanation.method === 'KernelExplainer' ||
    explanation.method === 'GradientExplainer';

  const headerLabel = isRuleBased
    ? 'Feature Attribution'
    : 'SHAP Feature Attribution';

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <FiBarChart2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {headerLabel}
          </p>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {prettyMethod(explanation.method)}
        </span>
      </div>

      {/* Rule-based note */}
      {isRuleBased && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg mb-2">
          {explanation.note || 'Each value is the points contributed by that feature to the module\'s final score.'}
        </div>
      )}

      {/* Base → Prediction summary — only for regression SHAP */}
      {isRegressionOutput && explanation.base_value !== undefined && Math.abs(explanation.base_value) > 0.01 && (
        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg mb-2">
          <span>Base: <strong>{formatShapValue(explanation.base_value).replace(/^\+/, '')}</strong></span>
          <span className="text-slate-300">→</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {formatShapValue(explanation.total_positive || 0)}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-red-600 dark:text-red-400">
            {formatShapValue(explanation.total_negative || 0)}
          </span>
          {explanation.prediction !== undefined && (
            <>
              <span className="text-slate-300">→</span>
              <span>
                Final: <strong style={{ color: moduleColor }}>{formatShapValue(explanation.prediction).replace(/^\+/, '')}</strong>
              </span>
            </>
          )}
        </div>
      )}

      {/* Classifier note (voice, tremor) */}
      {isClassifierOutput && (
        <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg mb-2">
          Feature contributions to the classifier decision. Values are in model output units.
        </div>
      )}

      {/* Feature bars */}
      <div className="space-y-1.5">
        {topFeatures.map((feature, idx) => {
          const barWidth = (feature.abs_shap / maxAbsShap) * 100;
          const isPositive = feature.shap_value > 0;
          const prettyName = feature.feature.replace(/_/g, ' ');

          return (
            <motion.div
              key={feature.feature}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-center gap-2 text-[11px]"
              title={feature.reason || prettyName}
            >
              {/* Direction icon */}
              <div
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                  isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}
              >
                {isPositive ? (
                  <FiTrendingUp className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <FiTrendingDown className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
                )}
              </div>

              {/* Feature name + value chip */}
              <div className="w-32 flex items-baseline gap-1.5 truncate">
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  {prettyName}
                </span>
                {typeof feature.value === 'string' && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate">
                    ({feature.value})
                  </span>
                )}
              </div>

              {/* Bar */}
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.04 }}
                  className={`h-full rounded-full ${
                    isPositive ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
              </div>

              {/* Value */}
              <span
                className={`w-16 text-right font-mono font-medium ${
                  isPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatShapValue(feature.shap_value)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Top drivers summary */}
      {((explanation.top_positive?.length || 0) > 0 ||
        (explanation.top_negative?.length || 0) > 0) && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          {explanation.top_positive && explanation.top_positive.length > 0 && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              <strong className="text-emerald-600 dark:text-emerald-400">Top positive:</strong>{' '}
              {explanation.top_positive.map((f) => f.feature.replace(/_/g, ' ')).join(', ')}
            </p>
          )}
          {explanation.top_negative && explanation.top_negative.length > 0 && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              <strong className="text-red-600 dark:text-red-400">Top negative:</strong>{' '}
              {explanation.top_negative.map((f) => f.feature.replace(/_/g, ' ')).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Info note */}
      <div className="mt-2 flex items-start gap-1.5">
        <FiInfo className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
          {isRuleBased
            ? 'Rule-based attributions are derived directly from the module\'s scoring formula. '
              + 'Each value represents points contributed by the feature to the final score.'
            : 'SHAP values show how much each feature pushed the model output up (+) or down (-) '
              + 'from the base value. Larger bars indicate stronger influence.'}
          {isClassifierOutput && (
            <span className="block mt-0.5 italic">
              Values are in model output units (log-odds for classifiers).
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default SHAPExplanation;