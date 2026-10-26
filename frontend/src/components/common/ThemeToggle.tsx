// src/components/common/ThemeToggle.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { FiMoon, FiSun } from 'react-icons/fi'

const ThemeToggle: React.FC = () => {
  const { toggleTheme, isDark } = useTheme()

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <FiSun className="w-5 h-5 text-yellow-500" />
      ) : (
        <FiMoon className="w-5 h-5 text-slate-600" />
      )}
    </motion.button>
  )
}

export default ThemeToggle