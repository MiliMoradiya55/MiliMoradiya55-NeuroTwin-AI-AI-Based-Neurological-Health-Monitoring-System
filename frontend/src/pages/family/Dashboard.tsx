import React from 'react'
import { FiHeart, FiCheckCircle, FiBell } from 'react-icons/fi'
import { motion } from 'framer-motion'

const FamilyDashboard: React.FC = () => {
  const alerts = [
    {
      id: 'A-1',
      date: '2026-08-01',
      level: 'info',
      title: 'Weekly Assessment Completed',
      message: 'Arthur completed the weekly 5-module assessment on time. All core markers remain within stable thresholds.',
    },
    {
      id: 'A-2',
      date: '2026-07-25',
      level: 'success',
      title: 'Brain Health Score Stable',
      message: 'Brain Health Score remained at 89/100 for the 4th consecutive week — a positive resilience indicator.',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Caregiver Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Monitoring neurological health for <span className="font-semibold text-indigo-600 dark:text-indigo-400">Arthur Vance</span>
        </p>
      </div>

      {/* Health Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex items-center justify-between"
      >
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">Current Health Status</span>
          <h2 className="text-3xl font-extrabold mt-1">89 / 100 — Stable</h2>
          <p className="text-sm text-slate-300 mt-1">12 consecutive weeks of assessments completed on schedule.</p>
        </div>
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-emerald-400 text-3xl">
          <FiHeart />
        </div>
      </motion.div>

      {/* Weekly Compliance Calendar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Weekly Assessment Compliance</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          {['Week 9', 'Week 10', 'Week 11', 'Week 12'].map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl"
            >
              <FiCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <span className="font-bold text-sm text-slate-800 dark:text-white block">{w}</span>
              <span className="text-xs text-emerald-700 dark:text-emerald-300">Completed ✓</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Domain Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Latest Assessment Domain Results</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { domain: 'Voice Analysis', score: 89, status: 'Stable' },
            { domain: 'Hand Tremor', score: 95, status: 'Optimal' },
            { domain: 'Memory Recall', score: 98, status: 'Optimal' },
            { domain: 'Typing Pattern', score: 87, status: 'Minor Variance' },
            { domain: 'Facial Movement', score: 92, status: 'Stable' },
            { domain: 'Reaction Speed', score: 91, status: 'Stable' },
          ].map((d, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">{d.domain}</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{d.score}<span className="text-xs font-normal text-slate-400">/100</span></p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                d.status === 'Optimal' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                d.status === 'Stable' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' :
                'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
              }`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <FiBell className="w-5 h-5 text-slate-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">Recent Notifications</h3>
        </div>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-xl border ${
              alert.level === 'info'
                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{alert.title}</p>
                <span className="text-xs text-slate-400">{alert.date}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FamilyDashboard