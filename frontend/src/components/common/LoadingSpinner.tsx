import React from 'react'
import { motion } from 'framer-motion'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"
        />
        <p className="mt-4 text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner