import React from 'react'

const TypingHistory: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-1">Typing Dynamics History</h4>
      <p className="text-slate-500">Average WPM: 48 | Latency Jitter: 42.8ms</p>
    </div>
  )
}

export default TypingHistory
