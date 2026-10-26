import React from 'react'

const ExplainableAI: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">SHAP Feature Attribution</h4>
      <p className="text-sm text-slate-500">Typing jitter contributed +42% to weekly divergence score variance.</p>
    </div>
  )
}

export default ExplainableAI
