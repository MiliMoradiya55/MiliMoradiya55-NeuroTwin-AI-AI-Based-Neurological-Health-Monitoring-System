// frontend/src/pages/patient/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FiActivity, FiTrendingUp, FiTrendingDown, FiMinus, FiAward,
  FiClock, FiCpu, FiHeart, FiZap, FiCalendar, FiArrowRight,
  FiDownload, FiShare2, FiAlertCircle, FiCheckCircle, FiBarChart2,
  FiUser, FiMail, FiMapPin, FiPhone, FiGlobe, FiLayers,
  FiTarget, FiCompass, FiStar, FiZapOff, FiRefreshCw,
  FiEye, FiEyeOff, FiMoon, FiSun, FiSliders, FiGrid,
  FiList, FiMaximize, FiMinimize, FiPlus,
  FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { Line, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '@/services/api';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ==================== INTERFACES ====================
interface DashboardData {
  brain_health_score: number;
  previous_score: number;
  change: number;
  total_assessments: number;
  streak: number;
  highest_score: number;
  lowest_score: number;
  last_assessment: string | null;
  modules: {
    voice: number;
    memory: number;
    tremor: number;
    typing: number;
    face: number;
  };
  baseline: {
    voice: number;
    memory: number;
    tremor: number;
    typing: number;
    face: number;
  };
}

interface TimelineData {
  labels: string[];
  scores: number[];
  voice_scores: number[];
  memory_scores: number[];
  tremor_scores: number[];
  typing_scores: number[];
  face_scores: number[];
  dates: string[];
  total_assessments: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  current_score: number;
  previous_score: number;
  mode_used: string;
  voice_baseline?: number;
  memory_baseline?: number;
  tremor_baseline?: number;
  typing_baseline?: number;
  face_baseline?: number;
}

interface Activity {
  id: string;
  type: string;
  score: number;
  accuracy: number;
  completed_at: string;
  module: string;
  status: 'completed' | 'pending' | 'failed';
}

// ==================== DEFAULT VALUES ====================
const DEFAULT_MODULES = {
  voice: 0,
  memory: 0,
  tremor: 0,
  typing: 0,
  face: 0
};

const DEFAULT_BASELINE = {
  voice: 0,
  memory: 0,
  tremor: 0,
  typing: 0,
  face: 0
};

const DEFAULT_DASHBOARD_DATA: DashboardData = {
  brain_health_score: 0,
  previous_score: 0,
  change: 0,
  total_assessments: 0,
  streak: 0,
  highest_score: 0,
  lowest_score: 0,
  last_assessment: null,
  modules: { ...DEFAULT_MODULES },
  baseline: { ...DEFAULT_BASELINE }
};

const DEFAULT_TIMELINE_DATA: TimelineData = {
  labels: [],
  scores: [],
  voice_scores: [],
  memory_scores: [],
  tremor_scores: [],
  typing_scores: [],
  face_scores: [],
  dates: [],
  total_assessments: 0,
  average_score: 0,
  highest_score: 0,
  lowest_score: 0,
  current_score: 0,
  previous_score: 0,
  mode_used: '',
  voice_baseline: 0,
  memory_baseline: 0,
  tremor_baseline: 0,
  typing_baseline: 0,
  face_baseline: 0
};

// ==================== HELPER FUNCTIONS ====================
const formatScore = (value: number): string => {
  if (value === undefined || value === null) return '0';
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1);
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Recent';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recent';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'Recent';
  }
};

// ==================== MODULE HELPERS ====================
const MODULE_COLORS: Record<string, string> = {
  voice: 'indigo',
  memory: 'purple',
  tremor: 'pink',
  typing: 'teal',
  face: 'amber',
};

const MODULE_ICONS: Record<string, any> = {
  voice: FiActivity,
  memory: FiCpu,
  tremor: FiHeart,
  typing: FiBarChart2,
  face: FiEye,
};

// ==================== MAIN COMPONENT ====================
const Dashboard: React.FC = () => {
  const { user } = useAuth(); // ✅ Use the user object from AuthContext
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [dashboardData, setDashboardData] = useState<DashboardData>({ ...DEFAULT_DASHBOARD_DATA });
  const [timelineData, setTimelineData] = useState<TimelineData>({ ...DEFAULT_TIMELINE_DATA });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasAssessments, setHasAssessments] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ===== INITIAL LOAD - DEPENDS ON USER =====
  useEffect(() => {
    if (user) {
      initializeDashboard();
    } else {
      setLoading(false);
      setHasAssessments(false);
    }
  }, [user]);

  // ===== RE-FETCH TIMELINE WHEN PERIOD CHANGES =====
  useEffect(() => {
    if (!user || !hasAssessments) return;

    const fetchTimelineOnly = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        console.log('🔄 Fetching timeline for period:', selectedPeriod);

        const timeRes = await api.get(`/timeline/data/${user.id}`, {
          params: { period: selectedPeriod },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (timeRes.data.status === 'success' && timeRes.data.data) {
          const data = timeRes.data.data;
          console.log('📊 Timeline updated:', data.labels, 'Mode:', data.mode_used);

          setTimelineData({
            labels: data.labels || [],
            scores: data.scores || [],
            voice_scores: data.voice_scores || [],
            memory_scores: data.memory_scores || [],
            tremor_scores: data.tremor_scores || [],
            typing_scores: data.typing_scores || [],
            face_scores: data.face_scores || [],
            dates: data.dates || [],
            total_assessments: data.total_assessments || 0,
            average_score: data.average_score || 0,
            highest_score: data.highest_score || 0,
            lowest_score: data.lowest_score || 0,
            current_score: data.current_score || 0,
            previous_score: data.previous_score || 0,
            mode_used: data.mode_used || '',
            voice_baseline: data.voice_baseline || 0,
            memory_baseline: data.memory_baseline || 0,
            tremor_baseline: data.tremor_baseline || 0,
            typing_baseline: data.typing_baseline || 0,
            face_baseline: data.face_baseline || 0
          });
        }
      } catch (error) {
        console.error('Error fetching timeline:', error);
      }
    };

    fetchTimelineOnly();
  }, [selectedPeriod, hasAssessments, user]);

  // ===== INITIALIZE DASHBOARD =====
  const initializeDashboard = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const hasAssessmentsResult = await checkAssessmentStatus();
      console.log('📊 Has assessments:', hasAssessmentsResult);
      setHasAssessments(hasAssessmentsResult);

      if (hasAssessmentsResult) {
        await fetchAllData();
      } else {
        setDashboardData({ ...DEFAULT_DASHBOARD_DATA });
        setTimelineData({ ...DEFAULT_TIMELINE_DATA });
        setActivities([]);
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setHasAssessments(false);
    } finally {
      setLoading(false);
    }
  };

  // ===== CHECK ASSESSMENT STATUS =====
  const checkAssessmentStatus = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await api.get(`/timeline/status/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === 'success') {
        return response.data.data.has_assessments === true;
      }
      return false;
    } catch (error) {
      console.error('Error checking assessment status:', error);
      return false;
    }
  };

  // ===== FETCH ALL DATA =====
  const fetchAllData = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // ===== Dashboard data =====
      const dashRes = await api.get(`/timeline/dashboard/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (dashRes.data.status === 'success' && dashRes.data.data) {
        const data = dashRes.data.data;
        console.log('📊 Dashboard loaded:', data);

        setDashboardData({
          brain_health_score: data.brain_health_score || 0,
          previous_score: data.previous_score || 0,
          change: data.change || 0,
          total_assessments: data.total_assessments || 0,
          streak: data.streak || 0,
          highest_score: data.highest_score || 0,
          lowest_score: data.lowest_score || 0,
          last_assessment: data.last_assessment || null,
          modules: data.modules || { ...DEFAULT_MODULES },
          baseline: data.baseline || { ...DEFAULT_BASELINE }
        });
      }

      // ===== Timeline data =====
      const timeRes = await api.get(`/timeline/data/${user.id}`, {
        params: { period: selectedPeriod },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (timeRes.data.status === 'success' && timeRes.data.data) {
        const data = timeRes.data.data;
        setTimelineData({
          labels: data.labels || [],
          scores: data.scores || [],
          voice_scores: data.voice_scores || [],
          memory_scores: data.memory_scores || [],
          tremor_scores: data.tremor_scores || [],
          typing_scores: data.typing_scores || [],
          face_scores: data.face_scores || [],
          dates: data.dates || [],
          total_assessments: data.total_assessments || 0,
          average_score: data.average_score || 0,
          highest_score: data.highest_score || 0,
          lowest_score: data.lowest_score || 0,
          current_score: data.current_score || 0,
          previous_score: data.previous_score || 0,
          mode_used: data.mode_used || '',
          voice_baseline: data.voice_baseline || 0,
          memory_baseline: data.memory_baseline || 0,
          tremor_baseline: data.tremor_baseline || 0,
          typing_baseline: data.typing_baseline || 0,
          face_baseline: data.face_baseline || 0
        });
      }

      // ===== Recent activities =====
      const actRes = await api.get(`/timeline/assessments/${user.id}`, {
        params: { limit: 7 },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (actRes.data.status === 'success' && actRes.data.assessments) {
        setActivities(actRes.data.assessments);
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        toast.error('Failed to load dashboard data');
      }
    }
  };

  // ===== REFRESH DASHBOARD =====
  const refreshDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const hasAssessmentsResult = await checkAssessmentStatus();
      setHasAssessments(hasAssessmentsResult);
      if (hasAssessmentsResult) {
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== CHART DATA ====================

  const getMainChartData = () => {
    if (!timelineData.labels || timelineData.labels.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: 'No data available',
            data: [0],
            borderColor: '#cbd5e1',
            backgroundColor: 'rgba(203, 213, 225, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          }
        ]
      };
    }

    const labels = timelineData.labels;

    const ensureDataLength = (data: number[]) => {
      if (!data || data.length === 0) return Array(labels.length).fill(0);
      if (data.length < labels.length) {
        return [...data, ...Array(labels.length - data.length).fill(0)];
      }
      return data;
    };

    return {
      labels: labels,
      datasets: [
        {
          label: 'Voice',
          data: ensureDataLength(timelineData.voice_scores),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Memory',
          data: ensureDataLength(timelineData.memory_scores),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Tremor',
          data: ensureDataLength(timelineData.tremor_scores),
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ec4899',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Typing',
          data: ensureDataLength(timelineData.typing_scores),
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#14b8a6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Face',
          data: ensureDataLength(timelineData.face_scores),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#f59e0b',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  };

  const getRadarData = () => {
    const modules = dashboardData.modules || DEFAULT_MODULES;
    const baseline = dashboardData.baseline || DEFAULT_BASELINE;

    const hasBaselineData = Object.values(baseline).some(v => v > 0);

    return {
      labels: ['Voice', 'Memory', 'Tremor', 'Typing', 'Face'],
      datasets: [
        {
          label: 'Current Performance',
          data: [
            modules.voice || 0,
            modules.memory || 0,
            modules.tremor || 0,
            modules.typing || 0,
            modules.face || 0,
          ],
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: hasBaselineData ? 'Personal Baseline' : 'Baseline (80)',
          data: hasBaselineData ? [
            baseline.voice || 0,
            baseline.memory || 0,
            baseline.tremor || 0,
            baseline.typing || 0,
            baseline.face || 0,
          ] : [80, 80, 80, 80, 80],
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          borderColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: '#94a3b8',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        }
      ]
    };
  };

  const getDonutData = () => {
    const modules = dashboardData.modules || DEFAULT_MODULES;
    const hasData = Object.values(modules).some(v => v > 0);

    return {
      labels: ['Voice', 'Memory', 'Tremor', 'Typing', 'Face'],
      datasets: [{
        data: hasData ? [
          modules.voice || 0,
          modules.memory || 0,
          modules.tremor || 0,
          modules.typing || 0,
          modules.face || 0,
        ] : [1, 1, 1, 1, 1],
        backgroundColor: hasData
          ? ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b']
          : ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0'],
        borderWidth: 0,
      }]
    };
  };

  // ==================== RENDER HELPERS ====================

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getModuleIcon = (module: string) => {
    return MODULE_ICONS[module?.toLowerCase()] || FiActivity;
  };

  const getModuleColor = (module: string) => {
    return MODULE_COLORS[module?.toLowerCase()] || 'slate';
  };

  // ==================== METRIC CARDS ====================
  const metricCards = [
    { id: 'brain-health', label: 'Brain Health', value: dashboardData.brain_health_score, change: dashboardData.change, icon: FiCpu, color: 'indigo', suffix: '/100' },
    { id: 'assessments', label: 'Assessments', value: dashboardData.total_assessments, icon: FiActivity, color: 'emerald', suffix: '' },
    { id: 'streak', label: 'Streak', value: `${dashboardData.streak}d`, icon: FiAward, color: 'amber', suffix: '' },
    { id: 'highest', label: 'Highest', value: dashboardData.highest_score, icon: FiTrendingUp, color: 'purple', suffix: '/100' },
    { id: 'lowest', label: 'Lowest', value: dashboardData.lowest_score, icon: FiTrendingDown, color: 'pink', suffix: '/100' },
    {
      id: 'modules',
      label: 'Modules',
      value: Object.values(dashboardData.modules || {}).filter(v => v > 0).length,
      icon: FiLayers,
      color: 'teal',
      suffix: ' active',
      isInteger: true
    },
  ];

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800/30 rounded-full" />
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading your digital twin...</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Analyzing neural patterns</p>
        </div>
      </div>
    );
  }

  // ==================== NO ASSESSMENTS STATE ====================
  if (!hasAssessments) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[70vh]"
      >
        <div className="text-center max-w-lg">
          <div className="relative inline-block">
            <div className="text-8xl mb-4 animate-float">🧠</div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            No Digital Twin Yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Complete your first assessment to create your personalized digital twin
            and unlock insights about your brain health.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.href = '/patient/assessment'}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2"
            >
              <FiZap className="w-5 h-5" />
              Start First Assessment
            </button>
            <button
              onClick={refreshDashboard}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <FiRefreshCw className="w-5 h-5" />
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==================== DASHBOARD VIEW ====================
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 10 },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 10,
        padding: 12,
        callbacks: {
          title: function(context: any) {
            return `📅 ${context[0]?.label || ''}`;
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}/100`;
          }
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#94a3b8', stepSize: 20 },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 30,
          font: { size: 10 },
        },
      },
    },
    interaction: { intersect: false, mode: 'index' as const },
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
            Clinical Digital Twin
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Real-time neurological health monitoring • {dashboardData.total_assessments} assessments completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshDashboard}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            <FiRefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </motion.div>

      {/* ===== METRIC CARDS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        {metricCards.map((stat) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group cursor-pointer"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${getScoreColor(typeof stat.value === 'number' ? stat.value : 0)}`}>
                  {stat.isInteger
                    ? stat.value
                    : typeof stat.value === 'number'
                      ? stat.value.toFixed(1)
                      : stat.value}
                  {stat.suffix}
                </p>
                {stat.change !== undefined && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {stat.change > 0 ?
                      <FiTrendingUp className="text-emerald-500" /> :
                      stat.change < 0 ?
                        <FiTrendingDown className="text-red-500" /> :
                        <FiMinus className="text-slate-500" />}
                    <span className={stat.change > 0 ? 'text-emerald-500' :
                      stat.change < 0 ? 'text-red-500' : 'text-slate-500'}>
                      {stat.change > 0 ? '+' : ''}{stat.change}%
                    </span>
                  </div>
                )}
              </div>
              <div className={`w-9 h-9 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-xl flex items-center justify-center text-${stat.color}-600 group-hover:scale-110 transition-all`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== MAIN CHART + RADAR ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Neurological Module Trends</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {timelineData.mode_used ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    {timelineData.mode_used}
                  </span>
                ) : (
                  'Multi-modal biomarker analysis over time'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {['weekly', 'monthly', 'yearly'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p as any)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${selectedPeriod === p
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            <Line data={getMainChartData()} options={chartOptions} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-500 rounded-full" />Voice</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full" />Memory</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-pink-500 rounded-full" />Tremor</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-teal-500 rounded-full" />Typing</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full" />Face</span>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
        >
          <h3 className="font-semibold text-slate-800 dark:text-white text-center mb-2">Neuro-Cognitive Profile</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-4">
            Current vs {Object.values(dashboardData.baseline || {}).some(v => v > 0) ? 'Personal Baseline' : 'Baseline (80)'}
          </p>
          <div className="h-[280px]">
            <Radar data={getRadarData()} options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  min: 0,
                  max: 100,
                  ticks: {
                    stepSize: 20,
                    backdropColor: 'transparent',
                    color: '#94a3b8',
                    font: { size: 8 },
                  },
                  grid: { color: 'rgba(99, 102, 241, 0.1)' },
                  pointLabels: {
                    color: '#64748b',
                    font: { size: 9 },
                  },
                },
              },
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: { size: 10 },
                    color: '#64748b',
                  },
                },
              },
            }} />
          </div>
          {Object.values(dashboardData.baseline || {}).some(v => v > 0) && (
            <div className="mt-2 text-center text-xs text-slate-400">
              <span className="text-emerald-500">●</span> Personal Baseline (Average of your scores)
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== MODULE BREAKDOWN ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Donut Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white text-center mb-2">Module Distribution</h3>
          <div className="h-[220px] flex items-center justify-center">
            <Doughnut data={getDonutData()} options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%',
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    usePointStyle: true,
                    padding: 10,
                    font: { size: 9 },
                    color: '#64748b',
                  },
                },
              },
            }} />
          </div>
        </div>

        {/* Module Performance */}
        <div className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Module Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(dashboardData.modules || {})
              .filter(([module]) => module !== 'reaction')
              .map(([module, score]) => {
                const Icon = getModuleIcon(module);
                const color = getModuleColor(module);
                const formattedScore = formatScore(score);
                const baseline = dashboardData.baseline?.[module as keyof typeof dashboardData.baseline] || 0;
                const hasBaseline = baseline > 0;
                const isImproved = hasBaseline && score >= baseline;
                const diff = hasBaseline && baseline > 0 ? ((score - baseline) / baseline * 100) : 0;

                return (
                  <motion.div
                    key={module}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`p-3 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl border border-${color}-200 dark:border-${color}-800/30 text-center hover:shadow-md transition-all cursor-pointer`}
                    whileHover={{ y: -2 }}
                  >
                    <Icon className={`w-5 h-5 mx-auto text-${color}-600 dark:text-${color}-400`} />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">{module}</p>
                    <p className={`text-xl font-bold ${getScoreColor(score)}`}>{formattedScore}</p>
                    {hasBaseline && (
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className={`text-[10px] ${isImproved ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isImproved ? '↑' : '↓'} {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                        </span>
                        <span className={`text-[10px] text-slate-400`}>
                          vs {formatScore(baseline)}
                        </span>
                      </div>
                    )}
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-600 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`} style={{ width: `${Math.min(score, 100)}%` }} />
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </motion.div>

      {/* ===== ACTIVITY FEED ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">Recent Activity</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest assessment history</p>
          </div>
          <button
            onClick={() => window.location.href = '/patient/assessment'}
            className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
          >
            View All →
          </button>
        </div>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.slice(0, 7).map((activity, index) => {
              const moduleKey = (activity.module || activity.type || 'combined').toLowerCase();
              const color = MODULE_COLORS[moduleKey] || 'slate';
              const Icon = MODULE_ICONS[moduleKey] || FiActivity;
              const displayName = moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);

              const uniqueKey = `${activity.type || 'activity'}-${activity.id || index}`;

              return (
                <motion.div
                  key={uniqueKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.6 }}
                  className={`flex items-center justify-between p-4 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl border border-${color}-200 dark:border-${color}-800/30 hover:shadow-sm transition-all cursor-pointer`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 bg-${color}-100 dark:bg-${color}-900/30 rounded-xl flex items-center justify-center text-${color}-600`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {displayName} Assessment
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(activity.completed_at)} •
                        {typeof activity.accuracy === 'number' ? activity.accuracy.toFixed(1) : activity.accuracy || 0}% accuracy
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Score</p>
                      <p className={`font-bold text-lg ${getScoreColor(activity.score || 0)}`}>
                        {typeof activity.score === 'number' ? activity.score.toFixed(1) : activity.score || 0}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${activity.status === 'completed' ? 'bg-emerald-500' : activity.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`} />
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>No recent activities</p>
              <p className="text-xs mt-1">Complete your first assessment to see activity here</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ===== FOOTER ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiCpu className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">NeuroTwin AI</span>
          </div>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>ID: NT-{String(user?.id || 1).padStart(4, '0')}</span>
          <span>•</span>
          <span>Last Sync: {dashboardData.last_assessment ?
            new Date(dashboardData.last_assessment).toLocaleString() :
            'Never'}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;