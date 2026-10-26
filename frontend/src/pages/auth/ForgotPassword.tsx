// src/pages/auth/ForgotPassword.tsx
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiMail, FiArrowLeft, FiSend, FiCpu } from 'react-icons/fi'
import toast from 'react-hot-toast'

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (_data: ForgotFormData) => {
    setLoading(true)
    try {
      // API call to send reset email
      await new Promise(resolve => setTimeout(resolve, 1500))
      setSent(true)
      toast.success('Reset link sent to your email!')
    } catch (error) {
      toast.error('Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="inline-block">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <FiCpu className="w-8 h-8 text-white" />
          </div>
        </motion.div>
        <h2 className="mt-4 text-2xl font-bold text-slate-800 dark:text-white">Reset Password</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Enter your email to receive a reset link
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-800/50 p-8 border border-slate-200 dark:border-slate-700">
        {!sent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  Send Reset Link
                </>
              )}
            </motion.button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <FiSend className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mt-4">
              Check Your Email
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              We've sent a password reset link to your email
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium hover:underline"
            >
              Try another email
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
            <FiArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword