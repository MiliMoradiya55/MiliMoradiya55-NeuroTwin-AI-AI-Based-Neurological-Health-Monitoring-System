import React from 'react'

const PatientTable: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Active Patient Roster Table</h4>
      <p className="text-sm text-slate-500">Displaying 10 assigned patients with risk stratification tags.</p>
    </div>
  )
}

export default PatientTable
