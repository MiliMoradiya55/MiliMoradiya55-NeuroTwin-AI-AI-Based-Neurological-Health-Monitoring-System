import React from 'react'

interface TremorResultProps {
  score?: number
}

const TremorResult: React.FC<TremorResultProps> = ({ score = 95 }) => {
  return (
    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Tremor Score</p>
      <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{score} / 100</p>
      <p className="text-xs text-slate-500 mt-1">Normal frequency: 4-6 Hz baseline</p>
    </div>
  )
}

export default TremorResult
