import React from 'react'

const TremorHistory: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Tremor History</h4>
      <p className="text-sm text-slate-500">No previous abnormal tremor spikes detected across 12 assessments.</p>
    </div>
  )
}

export default TremorHistory
