import React from 'react'

const Patients: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Roster</h1>
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">1,120 active patient profiles being continuously monitored.</p>
      </div>
    </div>
  )
}

export default Patients
