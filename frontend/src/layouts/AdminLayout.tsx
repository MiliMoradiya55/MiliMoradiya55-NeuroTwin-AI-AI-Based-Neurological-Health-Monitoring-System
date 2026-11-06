import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/common/Navbar'

const AdminLayout: React.FC = () => {
  // Navbar ને જરૂરી સ્ટેટ ઉમેર્યું
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout