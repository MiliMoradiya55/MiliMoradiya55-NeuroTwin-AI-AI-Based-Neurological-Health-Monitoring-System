import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/common/Navbar'

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
