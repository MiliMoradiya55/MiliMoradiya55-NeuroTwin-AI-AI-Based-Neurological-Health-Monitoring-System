import React from 'react'

const BlinkCounter: React.FC = () => {
  return (
    <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl text-center">
      <p className="text-xs text-slate-400">Blink Frequency</p>
      <p className="text-xl font-bold text-slate-800 dark:text-white">16 / min</p>
    </div>
  )
}

export default BlinkCounter
