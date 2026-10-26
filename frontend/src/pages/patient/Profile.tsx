// frontend/src/pages/patient/Profile.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FiUser, FiMail, FiCalendar, FiUserCheck, FiCpu,
  FiEdit2, FiSave, FiX, FiShield, FiClock, FiAward,
  FiMapPin, FiPhone, FiCamera,
  FiCheckCircle, FiHeart, FiActivity, FiTrendingUp,
  FiLoader
} from 'react-icons/fi';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface DashboardStats {
  brain_health_score: number;
  total_assessments: number;
  streak: number;
  highest_score: number;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  // ===== FETCH PROFILE DATA =====
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found');
        setLoading(false);
        return;
      }

      // Fetch user profile
      const profileRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileRes.data) {
        const userData = profileRes.data;
        setProfile(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          age: userData.age ? String(userData.age) : '',
          gender: userData.gender || '',
          phone: userData.phone || '',
          address: userData.address || '',
        });
      }

      // Fetch dashboard stats
      const userId = user?.id || 1;
      const statsRes = await api.get(`/timeline/dashboard/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsRes.data.status === 'success' && statsRes.data.data) {
        const data = statsRes.data.data;
        setStats({
          brain_health_score: data.brain_health_score || 0,
          total_assessments: data.total_assessments || 0,
          streak: data.streak || 0,
          highest_score: data.highest_score || 0,
        });
      }

    } catch (error: any) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        window.location.href = '/login';
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== SAVE PROFILE =====
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const updateData = {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        phone: formData.phone || null,
        address: formData.address || null,
      };

      const response = await api.put('/auth/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        setProfile(response.data);
        toast.success('Profile updated successfully! 🎉');
        setEditing(false);
      }

    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        logout();
        window.location.href = '/login';
      } else {
        toast.error(error.response?.data?.detail || 'Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // ===== HANDLE AVATAR CHANGE =====
  const handleAvatarChange = () => {
    toast.success('📸 Avatar upload coming soon!');
  };

  // ===== GET INITIALS =====
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  // ===== FORMAT DATE =====
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // ===== NORMALIZE GENDER FOR DISPLAY =====
  const normalizeGender = (gender: string | null | undefined): string => {
    if (!gender) return '';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  // ===== GET GENDER OPTIONS =====
  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800/30 rounded-full" />
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

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
            Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your personal information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              editing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
            } disabled:opacity-50`}
          >
            {editing ? (
              <>
                {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
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

      {/* ===== PROFILE CARD ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="relative">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />

          {/* Profile Photo */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                {profile ? getInitials(profile.name) : 'U'}
              </div>
              <button
                onClick={handleAvatarChange}
                className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
              >
                <FiCamera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-14 px-6 pb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {profile?.name || 'User'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Patient'}
                • ID: NT-{String(profile?.id || '0001').padStart(4, '0')}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {profile?.address || ''}
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {profile?.age ? `${profile.age} years` : ''}
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FiHeart className="w-3 h-3" />
                  {normalizeGender(profile?.gender)}
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <FiPhone className="w-3 h-3" />
                  {profile?.phone || ''}
                </span>

                {profile?.created_at && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    Joined {formatDate(profile.created_at)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile?.is_verified && (
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium flex items-center gap-1">
                  <FiCheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              {profile?.is_active && (
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium flex items-center gap-1">
                  <FiShield className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== STATS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Brain Health Score', value: stats?.brain_health_score || 'N/A', icon: FiCpu, color: 'indigo' },
          { label: 'Assessments', value: stats?.total_assessments || 0, icon: FiActivity, color: 'emerald' },
          { label: 'Streak', value: stats?.streak || 0, icon: FiAward, color: 'amber' },
          { label: 'Highest Score', value: stats?.highest_score || 'N/A', icon: FiTrendingUp, color: 'purple' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700"
          >
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

      {/* ===== PERSONAL INFORMATION CARD ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FiUser className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">
              Personal Information
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your account details
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
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
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  disabled={true}
                  className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all opacity-60 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Age
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  disabled={!editing}
                  min="1"
                  max="120"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Gender
              </label>
              <div className="relative">
                <FiUserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={!editing}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!editing}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Address
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editing}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl flex items-center gap-3">
            <FiShield className="w-5 h-5 text-emerald-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your data is encrypted and securely stored
            </p>
          </div>
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
            <span className="font-medium text-slate-600 dark:text-slate-300">NeuroTwin AI</span>
          </div>
          <span>•</span>
          <span>Profile</span>
          <span>•</span>
          <span>v2.4.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>ID: NT-{String(profile?.id || '0001').padStart(4, '0')}</span>
          <span>•</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;