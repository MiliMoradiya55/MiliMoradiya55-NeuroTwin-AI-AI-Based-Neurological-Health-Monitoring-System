// frontend/src/pages/patient/Notifications.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiCheckCircle, FiAlertCircle, FiClock,
  FiCalendar, FiTrendingUp, FiActivity, FiHeart,
  FiCpu, FiMail, FiStar, FiTrash2, FiCheck,
  FiChevronRight, FiFilter, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: any;
  color: string;
  action?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'success',
      title: 'Assessment Complete',
      message: 'Your weekly assessment has been completed successfully. Brain Health Score: 84.2',
      time: '2 min ago',
      read: false,
      icon: FiCheckCircle,
      color: 'emerald',
      action: 'View Results'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Tremor Pattern Detected',
      message: 'Subtle changes in hand tremor frequency detected. Please schedule a follow-up assessment.',
      time: '1 hour ago',
      read: false,
      icon: FiAlertCircle,
      color: 'amber',
      action: 'View Analysis'
    },
    {
      id: 3,
      type: 'info',
      title: 'New Report Available',
      message: 'Your monthly health report for July 2026 is now ready for download.',
      time: '3 hours ago',
      read: true,
      icon: FiClock,
      color: 'blue',
      action: 'Download'
    },
    {
      id: 4,
      type: 'alert',
      title: 'Memory Score Decline',
      message: 'Your memory score has declined by 5% over the last 30 days. Consider cognitive exercises.',
      time: '1 day ago',
      read: true,
      icon: FiActivity,
      color: 'red',
      action: 'View Recommendations'
    },
    {
      id: 5,
      type: 'success',
      title: 'Sleep Quality Improved',
      message: 'Your sleep quality has improved by 15% this week. Great job!',
      time: '2 days ago',
      read: true,
      icon: FiHeart,
      color: 'emerald',
      action: 'View Details'
    },
    {
      id: 6,
      type: 'info',
      title: 'AI Assistant Update',
      message: 'The NeuroTwin Clinical AI has been updated with new insights and recommendations.',
      time: '3 days ago',
      read: true,
      icon: FiCpu,
      color: 'purple',
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const handleAction = (notification: Notification) => {
    toast.success(`🔔 ${notification.action || 'Action'} clicked`);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

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
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Stay updated with your health insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <FiCheck className="w-4 h-4" />
              Mark All Read ({unreadCount})
            </button>
          )}
          <button
            onClick={clearAll}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            <FiTrash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </motion.div>

      {/* ===== FILTERS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl p-1">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'read', label: 'Read', count: notifications.length - unreadCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                filter === tab.id
                  ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                filter === tab.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setView(view === 'list' ? 'grid' : 'list')}
          className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
        >
          <FiRefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      </motion.div>

      {/* ===== NOTIFICATIONS LIST ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <FiBell className="w-10 h-10 text-slate-300 dark:text-slate-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">No Notifications</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : view === 'list' ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border transition-all ${
                  notification.read 
                    ? 'border-slate-200 dark:border-slate-700 opacity-80' 
                    : 'border-indigo-200 dark:border-indigo-800/30 shadow-indigo-100 dark:shadow-indigo-900/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 bg-${notification.color}-100 dark:bg-${notification.color}-900/30 rounded-xl flex items-center justify-center text-${notification.color}-600 flex-shrink-0`}>
                    <notification.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {notification.time}
                      </span>
                      {notification.action && (
                        <button
                          onClick={() => handleAction(notification)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1"
                        >
                          {notification.action}
                          <FiChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <FiCheck className="w-4 h-4 text-slate-400 hover:text-indigo-600" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <FiTrash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border transition-all ${
                  notification.read 
                    ? 'border-slate-200 dark:border-slate-700 opacity-80' 
                    : 'border-indigo-200 dark:border-indigo-800/30'
                }`}
              >
                <div className={`w-10 h-10 bg-${notification.color}-100 dark:bg-${notification.color}-900/30 rounded-xl flex items-center justify-center text-${notification.color}-600`}>
                  <notification.icon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white mt-3">
                  {notification.title}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {notification.time}
                  </span>
                  {notification.action && (
                    <button
                      onClick={() => handleAction(notification)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                    >
                      {notification.action}
                    </button>
                  )}
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mt-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    Mark as read
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
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
          <span>Notifications</span>
          <span>•</span>
          <span>v2.4.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{notifications.length} total</span>
          <span>•</span>
          <span>{unreadCount} unread</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Notifications;