import React from 'react'
import { FiChevronRight } from 'react-icons/fi'

const PatientList: React.FC = () => {
  const patients = [
    { id: 1, name: 'Arthur Vance', patientId: 'NT-8829', age: 58, score: 89, status: 'Minor Variance', primaryIssue: 'Typing rhythm variance' },
    { id: 2, name: 'Eleanor Rostova', patientId: 'NT-9104', age: 64, score: 94, status: 'Optimal', primaryIssue: 'Stable baseline' },
    { id: 3, name: 'Marcus Sterling', patientId: 'NT-7412', age: 71, score: 76, status: 'Action Required', primaryIssue: 'Voice tremor +18%' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Roster</h1>
        <p className="text-slate-500 dark:text-slate-400">View and manage all registered patient digital twins</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
        {patients.map((p) => (
          <div
            key={p.id}
            onClick={() => window.location.href = `/doctor/patient/${p.id}`}
            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                {p.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">{p.name} <span className="text-xs text-slate-400 font-normal">({p.patientId})</span></h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Primary Indicator: {p.primaryIssue}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{p.score} / 100</span>
                <span className="block text-xs text-slate-400">{p.status}</span>
              </div>
              <FiChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PatientList
