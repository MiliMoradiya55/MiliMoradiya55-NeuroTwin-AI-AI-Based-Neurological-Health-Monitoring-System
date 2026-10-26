import React from 'react'

const PatientProgress: React.FC = () => {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Longitudinal Progress</h1>
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">Tracking 12-week cognitive resilience progress for Arthur Vance.</p>
      </div>
    </div>
  )
}

export default PatientProgress
