import React from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle } from 'react-icons/fi'

const VerifyEmail: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl text-center border border-slate-200 dark:border-slate-700">
        <FiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Email Verified!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Your NeuroTwin AI account has been successfully verified.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all"
        >
          Proceed to Login
        </Link>
      </div>
    </div>
  )
}

export default VerifyEmail
