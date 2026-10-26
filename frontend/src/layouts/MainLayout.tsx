// src/layouts/MainLayout.tsx (With Navbar Height)
import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '@/components/common/Navbar'
import Sidebar from '@/components/common/Sidebar'
import { useAuth } from '@/context/AuthContext'

const MainLayout: React.FC = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!user) return <Outlet />

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <Sidebar sidebarOpen={sidebarOpen} />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`transition-all duration-300 ${
          sidebarOpen ? 'md:ml-[280px]' : 'md:ml-20'
        }`}
      >
        {/* ===== FIXED: Content starts after navbar ===== */}
        <div className="min-h-screen pt-[72px] md:pt-[80px] px-4 md:px-8 lg:px-10 pb-10">
          <div className="max-w-7xl mx-auto">
            {/* ===== ADDED: Spacer for breathing room ===== */}
            <div className="h-3 md:h-4" />
            <Outlet />
          </div>
        </div>
      </motion.main>
    </div>
  )
}

export default MainLayout