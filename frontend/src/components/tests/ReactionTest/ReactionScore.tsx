import React from 'react'

const ReactionScore: React.FC = () => {
  return (
    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
      <p className="text-xs text-emerald-600 font-semibold uppercase">Reaction Time Score</p>
      <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">91 / 100</p>
    </div>
  )
}

export default ReactionScore
