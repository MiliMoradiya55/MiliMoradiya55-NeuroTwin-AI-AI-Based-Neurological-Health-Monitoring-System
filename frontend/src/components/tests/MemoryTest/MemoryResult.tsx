import React from 'react'

const MemoryResult: React.FC = () => {
  return (
    <div className="p-4 bg-pink-50 dark:bg-pink-950/40 rounded-xl border border-pink-200 dark:border-pink-800 text-center">
      <p className="text-xs text-pink-600 font-semibold uppercase">Memory Score</p>
      <p className="text-3xl font-extrabold text-pink-700 dark:text-pink-300 mt-1">98 / 100</p>
    </div>
  )
}

export default MemoryResult
