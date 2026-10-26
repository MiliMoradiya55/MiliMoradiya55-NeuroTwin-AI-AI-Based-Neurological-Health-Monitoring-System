import React from 'react';
import { motion } from 'framer-motion';
import { FiActivity, FiAward, FiClock, FiCpu } from 'react-icons/fi';

const StatusSummary: React.FC = () => {
  const stats = [
    { label: 'Brain Health', value: '84.2', change: '+2.3%', icon: FiCpu, color: 'indigo' },
    { label: 'Assessments', value: '12', sub: 'This month', icon: FiActivity, color: 'emerald' },
    { label: 'Streak', value: '28 days', icon: FiAward, color: 'amber' },
    { label: 'Next Assessment', value: 'Tomorrow', icon: FiClock, color: 'purple' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
              {stat.change && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{stat.change}</p>
              )}
              {stat.sub && (
                <p className="text-xs text-slate-400">{stat.sub}</p>
              )}
            </div>
            <div className={`w-10 h-10 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-full flex items-center justify-center text-${stat.color}-600`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatusSummary;