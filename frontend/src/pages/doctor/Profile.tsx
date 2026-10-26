// src/pages/doctor/Profile.tsx
import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import {
  FiUser, FiMail, FiCalendar, FiUserCheck, FiCpu,
  FiEdit2, FiSave, FiX, FiShield, FiClock, FiAward,
  FiMapPin, FiPhone, FiHeart, FiActivity, FiSettings,
  FiCheckCircle, FiCamera
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const DoctorProfile: React.FC = () => {
  const { user } = useAuth()
  const [editing, setEditing] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const [formData, setFormData] = React.useState({
    name: user?.name || 'Dr. Sarah Chen',
    email: user?.email || 'sarah.chen@neurotwin.com',
    specialization: 'Neurology',
    hospital: 'NeuroTwin Medical Center',
    license: 'NT-2024-001',
    phone: '+1 (555) 123-4567',
    bio: 'Board-certified neurologist with over 15 years of experience.'
  })

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      toast.success('Profile updated successfully! 🎉')
      setEditing(false)
      setLoading(false)
    }, 1500)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Doctor Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your professional information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              editing 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
            }`}
          >
            {editing ? (
              <>
                <FiSave className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </>
            ) : (
              <>
                <FiEdit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </button>
          {editing && (
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2"
            >
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
          <div className="absolute -bottom-12 left-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {getInitials(formData.name)}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all">
                <FiCamera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {formData.name}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                {formData.specialization} • ID: {formData.license}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {formData.hospital}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FiPhone className="w-3 h-3" />
                  {formData.phone}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" />
                Verified
              </span>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium flex items-center gap-1">
                <FiShield className="w-3 h-3" />
                Secure
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Patients', value: '247', icon: FiUser, color: 'indigo' },
          { label: 'Assessments', value: '1,892', icon: FiActivity, color: 'emerald' },
          { label: 'Member Since', value: 'Jan 2024', icon: FiClock, color: 'purple' },
          { label: 'Rating', value: '4.9★', icon: FiAward, color: 'amber' },
        ].map((stat, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-full flex items-center justify-center text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Edit Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
      >
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Professional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Specialization
            </label>
            <div className="relative">
              <FiUserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Hospital
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              License Number
            </label>
            <div className="relative">
              <FiShield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Phone
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!editing}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            disabled={!editing}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiCpu className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">NeuroTwin AI</span>
          </div>
          <span>•</span>
          <span>Doctor Profile</span>
          <span>•</span>
          <span>v2.4.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Last updated: Today</span>
          <span>•</span>
          <span>ID: {formData.license}</span>
        </div>
      </motion.div>
    </div>
  )
}

export default DoctorProfile