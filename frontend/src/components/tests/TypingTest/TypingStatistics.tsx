import React from 'react'

interface TypingStatisticsProps {
  wpm: number
  accuracy: number
  latencyMs: number
  errorRate: number
  totalKeystrokes?: number
}

const TypingStatistics: React.FC<TypingStatisticsProps> = ({
  wpm,
  accuracy,
  latencyMs,
  errorRate,
  totalKeystrokes = 0,
}) => {
  const stats = [
    { label: 'Typing Speed', value: `${wpm} WPM`, sub: 'Words per minute', color: 'indigo' },
    { label: 'Key Accuracy', value: `${accuracy}%`, sub: 'Keystroke precision', color: 'emerald' },
    { label: 'Key Latency', value: `${latencyMs} ms`, sub: 'Inter-key interval', color: 'purple' },
    { label: 'Error Rate', value: `${errorRate}%`, sub: 'Backspace frequency', color: 'amber' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`bg-${s.color}-50 dark:bg-${s.color}-950/30 border border-${s.color}-100 dark:border-${s.color}-800 rounded-xl p-3 text-center`}
        >
          <p className={`text-2xl font-extrabold text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</p>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{s.label}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{s.sub}</p>
        </div>
      ))}
      {totalKeystrokes > 0 && (
        <div className="col-span-full text-center text-xs text-slate-400 mt-1">
          Total Keystrokes Recorded: <span className="font-bold text-slate-600 dark:text-slate-300">{totalKeystrokes}</span>
        </div>
      )}
    </div>
  )
}

export default TypingStatistics
