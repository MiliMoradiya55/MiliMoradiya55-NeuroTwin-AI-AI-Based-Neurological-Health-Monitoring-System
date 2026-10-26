import React from 'react'

const Doctors: React.FC = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Clinical Roster & Doctors</h1>
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">180 verified neurologists and clinical practitioners enrolled on the platform.</p>
      </div>
    </div>
  )
}

export default Doctors
