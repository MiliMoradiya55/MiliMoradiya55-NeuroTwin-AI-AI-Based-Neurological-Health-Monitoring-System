import React from 'react'

const BiometricDivergence: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Biometric Divergence Score</h4>
      <p className="text-sm text-slate-500">Relative deviation index: <strong>-2.8%</strong> (Within normal physiological limits)</p>
    </div>
  )
}

export default BiometricDivergence
