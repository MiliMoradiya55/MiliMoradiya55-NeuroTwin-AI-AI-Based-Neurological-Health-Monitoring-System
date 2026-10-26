import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

const DashboardLayout: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <Outlet />
    </motion.div>
  )
}

export default DashboardLayout