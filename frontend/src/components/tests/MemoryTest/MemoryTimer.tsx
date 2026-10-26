import React from 'react'

interface MemoryTimerProps {
  seconds?: number
}

const MemoryTimer: React.FC<MemoryTimerProps> = ({ seconds = 10 }) => {
  return (
    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-center font-mono text-indigo-600 font-bold text-sm">
      Time Remaining: {seconds}s
    </div>
  )
}

export default MemoryTimer
