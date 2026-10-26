import React from 'react'

const DoctorReport: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-1">Clinical Evaluation Summary</h4>
      <p className="text-sm text-slate-500">Includes XAI feature contributions and bi-weekly divergence plots.</p>
    </div>
  )
}

export default DoctorReport
