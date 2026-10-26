import React from 'react'

const AlertCard: React.FC = () => {
  return (
    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
      <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Status Update</h4>
      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Weekly assessment completed on schedule. No alerts.</p>
    </div>
  )
}

export default AlertCard
