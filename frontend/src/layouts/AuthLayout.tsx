// src/layouts/AuthLayout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Outlet />
      </motion.div>
    </div>
  )
}

export default AuthLayout