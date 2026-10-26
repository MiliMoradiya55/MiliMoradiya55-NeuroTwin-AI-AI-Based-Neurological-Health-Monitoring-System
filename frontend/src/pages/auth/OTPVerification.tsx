import React from 'react'
import { Link } from 'react-router-dom'

const OTPVerification: React.FC = () => {
  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Enter 6-Digit OTP</h2>
      <p className="text-xs text-slate-500 my-2">We sent a verification code to your email.</p>
      <input type="text" maxLength={6} className="w-full text-center py-3 border rounded-xl tracking-widest text-lg font-mono mb-4" placeholder="123456" />
      <Link to="/login" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold">Verify OTP</Link>
    </div>
  )
}

export default OTPVerification
