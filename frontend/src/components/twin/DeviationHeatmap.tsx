import React from 'react'

const DeviationHeatmap: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Longitudinal Deviation Heatmap</h4>
      <div className="grid grid-cols-6 gap-2 text-center text-xs">
        {['Voice', 'Tremor', 'Face', 'Memory', 'Type', 'React'].map((m, i) => (
          <div key={i} className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg">
            {m}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DeviationHeatmap
