// frontend/src/components/common/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FiHome, FiActivity, FiTrendingUp, FiCpu, FiFileText,
  FiMessageSquare, FiUser, FiBell, FiSettings,
  FiAward, FiZap, FiLogOut, FiChevronLeft,
  FiChevronRight, FiDroplet, FiCloud, FiHeart,
  FiBarChart2, FiLayers, FiTarget, FiCompass,
  FiStar, FiGlobe, FiShield, FiAlertCircle,
  FiUsers
} from 'react-icons/fi';

interface SidebarProps {
  sidebarOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getMenuItems = () => {
    const role = user?.role || 'patient';
    
    const menus: Record<string, Array<{ path: string; icon: any; label: string; badge?: string; color?: string }>> = {
      patient: [
        { path: '/patient/dashboard', icon: FiHome, label: 'Dashboard', color: 'indigo' },
        { path: '/patient/assessment', icon: FiActivity, label: 'Assessments', badge: '3', color: 'emerald' },
        { path: '/patient/timeline', icon: FiTrendingUp, label: 'Timeline', color: 'purple' },
        { path: '/patient/digital-twin', icon: FiCpu, label: 'Brain Health Profile', color: 'pink' },
        { path: '/patient/reports', icon: FiFileText, label: 'Reports', color: 'amber' },
        { path: '/patient/chat', icon: FiMessageSquare, label: 'AI Assistant', color: 'blue' },
        { path: '/patient/profile', icon: FiUser, label: 'Profile', color: 'teal' },
        { path: '/patient/notifications', icon: FiBell, label: 'Notifications', badge: '5', color: 'rose' },
        { path: '/patient/settings', icon: FiSettings, label: 'Settings', color: 'slate' },
      ],
      doctor: [
        { path: '/doctor/dashboard', icon: FiHome, label: 'Dashboard', color: 'indigo' },
        { path: '/doctor/patients', icon: FiUsers, label: 'Patients', badge: '12', color: 'emerald' },
        { path: '/doctor/analytics', icon: FiBarChart2, label: 'Analytics', color: 'purple' },
        { path: '/doctor/reports', icon: FiFileText, label: 'Reports', color: 'amber' },
        { path: '/doctor/profile', icon: FiUser, label: 'Profile', color: 'teal' },
        { path: '/doctor/settings', icon: FiSettings, label: 'Settings', color: 'slate' },
      ],
      family: [
        { path: '/family/dashboard', icon: FiHome, label: 'Dashboard', color: 'indigo' },
        { path: '/family/progress', icon: FiTrendingUp, label: 'Progress', color: 'emerald' },
        { path: '/family/alerts', icon: FiAlertCircle, label: 'Alerts', badge: '2', color: 'rose' },
        { path: '/family/profile', icon: FiUser, label: 'Profile', color: 'teal' },
        { path: '/family/settings', icon: FiSettings, label: 'Settings', color: 'slate' },
      ],
      admin: [
        { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard', color: 'indigo' },
        { path: '/admin/users', icon: FiUsers, label: 'Users', color: 'emerald' },
        { path: '/admin/doctors', icon: FiShield, label: 'Doctors', color: 'purple' },
        { path: '/admin/settings', icon: FiSettings, label: 'Settings', color: 'slate' },
        { path: '/admin/logs', icon: FiAlertCircle, label: 'System Logs', color: 'amber' },
      ],
    };
    
    return menus[role] || menus.patient;
  };

  const menuItems = getMenuItems();

  return (
    <motion.aside
      initial={false}
      animate={{
        width: sidebarOpen ? 280 : 72,   // ← Width 280px (increased from 256)
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-16 h-[calc(100vh-64px)] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 overflow-hidden z-40 shadow-xl shadow-slate-200/20 dark:shadow-slate-800/20"
    >
      <div className="h-full overflow-y-auto py-4">
        
        {/* ===== MINI AVATAR (when collapsed) ===== */}
        {!sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-4"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/20">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </motion.div>
        )}

        {/* ===== NAVIGATION ===== */}
        <div className="px-3 space-y-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isHovered = hoveredItem === item.path;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={index}
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  } ${!sidebarOpen && 'justify-center'}`
                }
              >
                <div className={`relative ${isActive ? 'text-white' : `text-${item.color || 'slate'}-500 dark:text-${item.color || 'slate'}-400`}`}>
                  <Icon className={`w-5 h-5 ${!sidebarOpen && 'w-6 h-6'} transition-transform group-hover:scale-110`} />
                  {item.badge && (
                    <span className={`absolute -top-1 -right-2 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="font-medium text-sm flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
                {isActive && sidebarOpen && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-3 w-1.5 h-6 bg-white rounded-full"
                  />
                )}
                {!sidebarOpen && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-full ml-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg whitespace-nowrap z-50"
                  >
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* ===== BOTTOM SECTION ===== */}
        <div className={`absolute bottom-4 left-3 right-3 ${!sidebarOpen && 'hidden'}`}>
          <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all group"
            >
              <FiLogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </div>

        {/* ===== COLLAPSED BOTTOM ===== */}
        {!sidebarOpen && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
            >
              <FiLogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;