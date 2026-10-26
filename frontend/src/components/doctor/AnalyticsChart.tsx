import React from 'react'

const AnalyticsChart: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Population Longitudinal Analytics</h4>
      <p className="text-sm text-slate-500">Cohort trajectory stability score: 94.2% across 1,120 active twins.</p>
    </div>
  )
}

export default AnalyticsChart
