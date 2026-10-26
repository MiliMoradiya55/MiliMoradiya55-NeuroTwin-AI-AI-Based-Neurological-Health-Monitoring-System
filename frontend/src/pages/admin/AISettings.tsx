import React from 'react'

const AISettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Model & Calibration Settings</h1>
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-2">SHAP Attribution Thresholds</h3>
        <p className="text-sm text-slate-500">Configure sensitivity thresholds for automated divergence alerting.</p>
      </div>
    </div>
  )
}

export default AISettings
