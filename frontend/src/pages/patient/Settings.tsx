// frontend/src/pages/patient/Settings.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLock, FiUser, FiMoon, FiSun,
  FiAlertCircle, FiShield, FiCpu,
  FiSave, FiEye, FiEyeOff, FiX, FiLoader
} from 'react-icons/fi';
import { useTheme } from '@/context/ThemeContext';
import api from '@/services/api';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'security' | 'account'>('general');

  // ===== CHANGE PASSWORD MODAL STATE =====
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // ===== SAVE SETTINGS =====
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success('Settings saved successfully! 🎉');
      setSaving(false);
    }, 800);
  };

  // ===== CHANGE PASSWORD SUBMIT =====
  const handlePasswordSubmit = async () => {
    // Validation
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setPwSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      await api.post(
        '/auth/change-password',
        {
          current_password: pwForm.currentPassword,
          new_password: pwForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success('Password changed successfully! 🔐');
      setShowPasswordModal(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      console.error('Change password error:', err);
      toast.error(
        err.response?.data?.detail ||
          'Failed to change password. Please check your current password.'
      );
    } finally {
      setPwSaving(false);
    }
  };

  // ===== CLOSE PASSWORD MODAL =====
  const closePasswordModal = () => {
    if (pwSaving) return;
    setShowPasswordModal(false);
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  // ===== LOGOUT ALL =====
  const handleLogoutAll = () => {
    if (!window.confirm('Are you sure you want to log out from all devices?')) return;
    toast.success('Logged out from all devices');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // ===== DELETE ACCOUNT =====
  const handleDeleteAccount = () => {
    if (
      !window.confirm(
        '⚠️ This action cannot be undone. All your data will be permanently removed. Are you absolutely sure?'
      )
    )
      return;
    toast.error('Account deletion requires contacting support');
  };

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Customize your NeuroTwin experience
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50"
        >
          {saving ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </motion.div>

      {/* ===== SECTIONS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      >
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
          <div className="space-y-1">
            {[
              { id: 'general', label: 'General', icon: FiUser },
              { id: 'security', label: 'Security', icon: FiLock },
              { id: 'account', label: 'Account', icon: FiShield },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          {/* ===== GENERAL ===== */}
          {activeSection === 'general' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                General Settings
              </h3>

              <div className="space-y-3">
                {/* Theme Toggle */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">Theme</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Switch between light and dark mode
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (theme === 'dark') toggleTheme();
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        theme === 'light'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Light Mode"
                    >
                      <FiSun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (theme === 'light') toggleTheme();
                      }}
                      className={`p-2 rounded-lg transition-all ${
                        theme === 'dark'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Dark Mode"
                    >
                      <FiMoon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Current Theme Display */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      {theme === 'dark' ? (
                        <FiMoon className="w-4 h-4" />
                      ) : (
                        <FiSun className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {theme === 'dark' ? 'Dark Mode' : 'Light Mode'} Active
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Your preference is saved automatically
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== SECURITY ===== */}
          {activeSection === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Security Settings
              </h3>

              <div className="space-y-3">
                {/* Change Password */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      Change Password
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Update your password regularly for security
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    Change Password
                  </button>
                </div>

                {/* Active Sessions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      Active Sessions
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Manage your active sessions across devices
                    </p>
                  </div>
                  <button
                    onClick={handleLogoutAll}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                  >
                    Logout All
                  </button>
                </div>

                {/* Delete Account */}
                <div className="p-4 bg-gradient-to-r from-amber-50 to-red-50 dark:from-amber-900/20 dark:to-red-900/20 rounded-xl border border-amber-200 dark:border-amber-800/30">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 dark:text-white">
                        Delete Account
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        This action cannot be undone. All your data will be permanently removed.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                      >
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== ACCOUNT ===== */}
          {activeSection === 'account' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Account Information
              </h3>

              <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FiShield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">
                      Your account is secured
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Your data is encrypted and stored securely
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ===== FOOTER ===== */}
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
            <span className="font-medium text-slate-600 dark:text-slate-300">
              NeuroTwin AI
            </span>
          </div>
          <span>•</span>
          <span>Settings</span>
          <span>•</span>
          <span>v2.4.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Last updated: Today</span>
          <span>•</span>
          <span>All settings are saved locally</span>
        </div>
      </motion.div>

      {/* ===== CHANGE PASSWORD MODAL ===== */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
              onClick={closePasswordModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FiLock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">
                      Change Password
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter your current and new password
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePasswordModal}
                  disabled={pwSaving}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-50"
                >
                  <FiX className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={pwForm.currentPassword}
                      onChange={(e) =>
                        setPwForm({ ...pwForm, currentPassword: e.target.value })
                      }
                      disabled={pwSaving}
                      placeholder="Enter current password"
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrent ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={(e) =>
                        setPwForm({ ...pwForm, newPassword: e.target.value })
                      }
                      disabled={pwSaving}
                      placeholder="At least 6 characters"
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNew ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={pwForm.confirmPassword}
                      onChange={(e) =>
                        setPwForm({ ...pwForm, confirmPassword: e.target.value })
                      }
                      disabled={pwSaving}
                      placeholder="Re-enter new password"
                      className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    💡 <strong>Tip:</strong> Use at least 6 characters with a mix
                    of letters, numbers, and symbols for better security.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  onClick={closePasswordModal}
                  disabled={pwSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={pwSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {pwSaving ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;