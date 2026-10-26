import React from 'react'
import { motion } from 'framer-motion'
import { FiCpu, FiUsers, FiActivity, FiShield, FiServer, FiTrendingUp } from 'react-icons/fi'

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Active Users', value: '1,420', icon: FiUsers, color: 'indigo', change: '+12%' },
    { label: 'Assessments Processed', value: '18,450', icon: FiActivity, color: 'emerald', change: '+8%' },
    { label: 'Calibrated Digital Twins', value: '1,280', icon: FiCpu, color: 'purple', change: '+5%' },
    { label: 'System Uptime', value: '99.98%', icon: FiServer, color: 'blue', change: 'Stable' },
  ]

  const models = [
    { name: 'Voice Prosody & Jitter Model v2', status: 'Operational', latency: '42ms', uptime: '99.8%' },
    { name: 'Computer Vision Tremor Tracker v3', status: 'Operational', latency: '38ms', uptime: '99.9%' },
    { name: 'Typing Dynamics Classifier v1', status: 'Operational', latency: '12ms', uptime: '100%' },
    { name: 'Memory Cognitive Scorer v2', status: 'Operational', latency: '18ms', uptime: '99.9%' },
    { name: 'SHAP XAI Attribution Engine', status: 'Operational', latency: '55ms', uptime: '99.5%' },
    { name: 'LLM Clinical AI Assistant', status: 'Operational', latency: '280ms', uptime: '99.2%' },
  ]

  const roleData = [
    { role: 'Patients', count: 1120, pct: 79 },
    { role: 'Doctors', count: 180, pct: 13 },
    { role: 'Family', count: 110, pct: 8 },
    { role: 'Admins', count: 10, pct: 1 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin System Telemetry</h1>
          <p className="text-slate-500 dark:text-slate-400">Platform health, AI pipeline, and user analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          All Systems Operational
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-950/50 flex items-center justify-center text-${s.color}-600 dark:text-${s.color}-400`}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{s.value}</p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{s.change} this month</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Model Pipeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FiCpu className="w-5 h-5 text-indigo-500" />
            AI Model Pipeline Status
          </h3>
          <div className="space-y-3">
            {models.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{m.name}</p>
                  <p className="text-xs text-slate-400">Latency: {m.latency} • Uptime: {m.uptime}</p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold rounded-full">
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-purple-500" />
            User Role Distribution
          </h3>
          <div className="space-y-4">
            {roleData.map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.role}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{r.count.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
              <FiTrendingUp className="w-4 h-4" />
              Platform Growth
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              User registrations increased <strong>+12%</strong> month-over-month across all roles.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Audit */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <FiShield className="w-5 h-5 text-emerald-500" />
          Security & Audit Log
        </h3>
        <div className="space-y-2">
          {[
            { action: 'Patient Login', user: 'patient@neurotwin.ai', time: '2 min ago', status: 'OK' },
            { action: 'Assessment Submitted', user: 'patient@neurotwin.ai', time: '15 min ago', status: 'OK' },
            { action: 'Report Downloaded', user: 'doctor@neurotwin.ai', time: '1 hr ago', status: 'OK' },
            { action: 'Admin Login', user: 'admin@neurotwin.ai', time: '2 hr ago', status: 'OK' },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">{log.action}</span>
              <span className="text-slate-400">{log.user}</span>
              <span className="text-slate-400 text-xs">{log.time}</span>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">{log.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard