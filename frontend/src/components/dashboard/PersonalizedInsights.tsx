import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiActivity } from 'react-icons/fi';

const PersonalizedInsights: React.FC = () => {
  const insights = [
    {
      title: 'Typing Rhythm Variance',
      description: 'Keystroke timing shows a 13% increase in latency, indicating possible motor fatigue.',
      severity: 'Moderate Severity',
      risk: 'Low Risk',
      mitigation: 'Take 10-minute keyboard breaks every hour and practice finger stretching.',
      icon: FiActivity,
      color: 'amber',
    },
    {
      title: 'Cognitive Resilience Stable',
      description: 'Memory recall and facial symmetry scores have remained stable over the last 30 days.',
      severity: 'Low Severity',
      risk: 'No Risk',
      icon: FiCheckCircle,
      color: 'emerald',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-white">Personalized Insights</h3>
        <span className="text-xs text-slate-400">AI Powered</span>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 bg-${insight.color}-50 dark:bg-${insight.color}-900/20 rounded-xl border border-${insight.color}-200 dark:border-${insight.color}-800/30`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 bg-${insight.color}-100 dark:bg-${insight.color}-900/30 rounded-full flex items-center justify-center text-${insight.color}-600 flex-shrink-0`}>
                <insight.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-slate-800 dark:text-white">{insight.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-${insight.color}-200 dark:bg-${insight.color}-800/30 text-${insight.color}-700 dark:text-${insight.color}-300`}>
                    {insight.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{insight.description}</p>
                {insight.mitigation && (
                  <div className="mt-2 p-2 bg-white/50 dark:bg-slate-700/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">Mitigation:</span> {insight.mitigation}
                    </p>
                  </div>
                )}
                {insight.risk && (
                  <p className="text-xs text-slate-400 mt-1">Risk: {insight.risk}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PersonalizedInsights;