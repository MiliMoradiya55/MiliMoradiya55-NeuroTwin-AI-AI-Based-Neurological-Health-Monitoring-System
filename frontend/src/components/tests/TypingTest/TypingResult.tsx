import React from 'react'

const TypingResult: React.FC = () => {
  return (
    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center">
      <p className="text-xs text-indigo-600 font-semibold uppercase">Typing Score</p>
      <p className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">87 / 100</p>
    </div>
  )
}

export default TypingResult
