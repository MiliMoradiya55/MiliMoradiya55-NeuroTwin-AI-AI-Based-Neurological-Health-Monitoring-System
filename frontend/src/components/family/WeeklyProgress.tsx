import React from 'react'

const WeeklyProgress: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white">Weekly Progress Tracker</h4>
      <p className="text-sm text-slate-500 mt-1">4 out of 4 weekly micro-assessments completed this month.</p>
    </div>
  )
}

export default WeeklyProgress
