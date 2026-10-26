import React from 'react'

const VoiceVisualizer: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-1 h-12 bg-slate-900 rounded-xl p-2">
      {[40, 70, 30, 90, 60, 80, 50, 95, 45, 65].map((h, i) => (
        <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export default VoiceVisualizer
