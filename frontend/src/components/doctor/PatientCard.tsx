import React from 'react'

interface PatientCardProps {
  name?: string
  score?: number
  status?: string
}

const PatientCard: React.FC<PatientCardProps> = ({ name = 'Arthur Vance', score = 89, status = 'Stable' }) => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white">{name}</h4>
      <p className="text-sm text-slate-500">Brain Twin Index: <span className="font-bold text-indigo-600">{score}/100</span> • {status}</p>
    </div>
  )
}

export default PatientCard
