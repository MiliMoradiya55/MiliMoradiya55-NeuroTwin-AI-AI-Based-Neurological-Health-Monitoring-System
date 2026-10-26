import React from 'react'

const VoiceScore: React.FC = () => {
  return (
    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center">
      <p className="text-xs text-indigo-600 font-semibold uppercase">Voice Health Score</p>
      <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">89 / 100</p>
    </div>
  )
}

export default VoiceScore
