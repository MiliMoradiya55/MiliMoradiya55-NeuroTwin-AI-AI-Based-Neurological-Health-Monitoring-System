// src/pages/doctor/Dashboard.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FiUsers, FiActivity, FiTrendingUp, FiAward,
  FiFileText, FiChevronRight, FiSearch, FiFilter
} from 'react-icons/fi'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'

const DoctorDashboard: React.FC = () => {
  const [patients] = useState([
    { id: 1, name: 'Arthur Vance', age: 58, score: 89, status: 'Stable', lastVisit: 'Yesterday' },
    { id: 2, name: 'Eleanor Rostova', age: 64, score: 94, status: 'Optimal', lastVisit: '3 days ago' },
    { id: 3, name: 'Marcus Sterling', age: 71, score: 76, status: 'Attention', lastVisit: '1 week ago' },
  ])

  const stats = [
    { label: 'Total Patients', value: '24', icon: FiUsers, color: 'indigo' },
    { label: 'Active Assessments', value: '8', icon: FiActivity, color: 'emerald' },
    { label: 'Avg Score', value: '86.4', icon: FiTrendingUp, color: 'purple' },
    { label: 'Attention Required', value: '1', icon: FiAward, color: 'red' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Doctor Clinical Portal</h1>
          <p className="text-slate-500 dark:text-slate-400">Monitor your patients' longitudinal neurological health</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<FiFileText className="w-4 h-4" />}>
            Generate Clinical Summary
          </Button>
          <Button icon={<FiUsers className="w-4 h-4" />}>
            Register New Patient
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-full flex items-center justify-center text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Patient List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-white">Recent Patients</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
              <FiFilter className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {patients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => window.location.href = `/doctor/patient/${patient.id}`}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 dark:text-white">{patient.name}</h4>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span>{patient.age} years</span>
                      <span>•</span>
                      <span>Score: {patient.score}/100</span>
                      <span>•</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
                        {patient.lastVisit}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                    patient.status === 'Stable' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : patient.status === 'Optimal'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {patient.status}
                  </span>
                  <FiChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default DoctorDashboard