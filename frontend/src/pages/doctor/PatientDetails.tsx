import React from 'react'
import { useParams } from 'react-router-dom'
import { FiFileText, FiArrowLeft } from 'react-icons/fi'
import BrainHealthChart from '@/components/charts/BrainHealthChart'
import toast from 'react-hot-toast'

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const handleDownload = () => toast.success(`📄 Clinical PDF report generated for Patient #${id || '8829'}.`)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Patients
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2"
        >
          <FiFileText className="w-4 h-4" /> Download PDF Clinical Summary
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          AV
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Arthur Vance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Patient ID: NT-{id || '8829'} | Age: 58 | Enrolled: 12 Weeks</p>
        </div>
      </div>

      <BrainHealthChart score={89.0} change={-3.0} />

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Explainable AI (XAI) Attribution</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The 3-point score reduction is attributable to a 13% elevation in typing latency (46.8 ms vs baseline 41.5 ms) 
          and a -4.2% shift in vocal pitch stability. Hand tremor amplitude remains within normal physiological limits (0.14 mm).
        </p>
      </div>
    </div>
  )
}

export default PatientDetails
