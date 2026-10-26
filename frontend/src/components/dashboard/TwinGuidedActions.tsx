import React from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiMic, FiCpu, FiArrowRight } from 'react-icons/fi';

const TwinGuidedActions: React.FC = () => {
  const actions = [
    {
      title: 'Digital Dexterity Drill',
      description: 'Complete a 2-minute typing rhythm test to recalibrate your motor pattern baseline.',
      icon: FiActivity,
      color: 'indigo',
      duration: '2 min',
    },
    {
      title: 'Vocal Resonance Exercise',
      description: 'Perform 3 minutes of hum-based vocal exercises to stabilize frequency variance detected.',
      icon: FiMic,
      color: 'purple',
      duration: '3 min',
    },
    {
      title: 'Hand Steadying Technique',
      description: 'Engage in 5 minutes of fine motor focus (like drawing circles) to address tremor indicators.',
      icon: FiCpu,
      color: 'pink',
      duration: '5 min',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Twin-Guided Actions</h3>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 bg-${action.color}-100 dark:bg-${action.color}-900/30 rounded-full flex items-center justify-center text-${action.color}-600 flex-shrink-0`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-800 dark:text-white">{action.title}</h4>
                  <span className="text-xs text-slate-400">{action.duration}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{action.description}</p>
              </div>
              <FiArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors mt-1" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default TwinGuidedActions;