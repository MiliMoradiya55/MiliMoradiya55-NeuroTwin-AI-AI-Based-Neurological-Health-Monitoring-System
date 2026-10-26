// frontend/src/pages/patient/Timeline.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FiCalendar, FiTrendingUp, FiTrendingDown, FiMinus,
  FiAward, FiClock, FiChevronRight, FiBarChart2,
  FiActivity, FiCpu, FiHeart, FiZap, FiEye, FiMic,
  FiType, FiRefreshCw, FiMaximize2, FiMinimize2,
  FiChevronLeft, FiChevronRight as FiChevronRightIcon,
  FiGrid, FiList, FiFilter, FiDownload, FiShare2,
  FiStar, FiGlobe, FiTarget, FiCompass, FiInfo
} from 'react-icons/fi';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ==================== INTERFACES ====================
interface ModuleData {
  current: number;
  baseline: number;
  weekly: number[];
  monthly: number[];
  yearly: number[];
  weekly_labels: string[];
  monthly_labels: string[];
  yearly_labels: string[];
  hasData: boolean;
}

interface TimelineData {
  voice: ModuleData;
  memory: ModuleData;
  tremor: ModuleData;
  typing: ModuleData;
  face: ModuleData;
}

interface Activity {
  id: number;
  type: string;
  score: number;
  accuracy: number;
  completed_at: string;
  module: string;
  status: 'completed' | 'pending' | 'failed';
}

// ==================== DEFAULT DATA ====================
const DEFAULT_MODULE_DATA: ModuleData = {
  current: 0,
  baseline: 0,
  weekly: [],
  monthly: [],
  yearly: [],
  weekly_labels: [],
  monthly_labels: [],
  yearly_labels: [],
  hasData: false
};

const DEFAULT_TIMELINE_DATA: TimelineData = {
  voice: { ...DEFAULT_MODULE_DATA },
  memory: { ...DEFAULT_MODULE_DATA },
  tremor: { ...DEFAULT_MODULE_DATA },
  typing: { ...DEFAULT_MODULE_DATA },
  face: { ...DEFAULT_MODULE_DATA }
};

// ==================== MODULE CONFIG ====================
const MODULE_CONFIGS = {
  voice: {
    label: 'Voice Analysis',
    icon: FiMic,
    color: '#6366f1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    apiKey: 'voice_scores'
  },
  memory: {
    label: 'Memory Recall',
    icon: FiCpu,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    apiKey: 'memory_scores'
  },
  tremor: {
    label: 'Hand Tremor',
    icon: FiHeart,
    color: '#ec4899',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    apiKey: 'tremor_scores'
  },
  typing: {
    label: 'Typing Pattern',
    icon: FiType,
    color: '#14b8a6',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    apiKey: 'typing_scores'
  },
  face: {
    label: 'Facial Expression',
    icon: FiEye,
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    apiKey: 'face_scores'
  }
};

// ==================== MAIN COMPONENT ====================
const Timeline: React.FC = () => {
  const { user } = useAuth(); // ✅ Use user from AuthContext
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('voice');
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [timelineData, setTimelineData] = useState<TimelineData>({ ...DEFAULT_TIMELINE_DATA });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hasAnyData, setHasAnyData] = useState(false);

  // ===== INITIAL LOAD - DEPENDS ON USER =====
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
      setHasAnyData(false);
    }
  }, [user]);

  // ===== REFETCH TIMELINE WHEN PERIOD CHANGES =====
  useEffect(() => {
    if (!user || !hasAnyData || loading) return;

    const fetchPeriodData = async () => {
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

          const moduleData = buildModuleData(data);
          setTimelineData(moduleData);
        }
      } catch (error) {
        console.error('Error fetching period data:', error);
      }
    };

    fetchPeriodData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  // ===== FETCH DATA FROM BACKEND =====
  const fetchData = async () => {
    if (!user) return; // ✅ Guard clause

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found');
        setLoading(false);
        return;
      }

      // ===== FIRST CHECK IF USER HAS ASSESSMENTS =====
      const statusRes = await api.get(`/timeline/status/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Timeline status:', statusRes.data);

      if (statusRes.data.status === 'success' && statusRes.data.data) {
        const hasData = statusRes.data.data.has_assessments;

        if (!hasData) {
          setHasAnyData(false);
          setLoading(false);
          setTimelineData({ ...DEFAULT_TIMELINE_DATA });
          setActivities([]);
          return;
        }
      }

      // ===== FETCH TIMELINE DATA =====
      const timeRes = await api.get(`/timeline/data/${user.id}`, {
        params: { period: selectedPeriod },
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Timeline data:', timeRes.data);

      if (timeRes.data.status === 'success' && timeRes.data.data) {
        const data = timeRes.data.data;

        // Check if data has any scores
        const allScores = [
          ...(data.voice_scores || []),
          ...(data.memory_scores || []),
          ...(data.tremor_scores || []),
          ...(data.typing_scores || []),
          ...(data.face_scores || [])
        ];

        const hasRealData = allScores.some(s => s > 0);

        if (hasRealData) {
          const moduleData = buildModuleData(data);
          setTimelineData(moduleData);
          setHasAnyData(true);
        } else {
          setHasAnyData(false);
          setTimelineData({ ...DEFAULT_TIMELINE_DATA });
        }
      } else {
        setHasAnyData(false);
        setTimelineData({ ...DEFAULT_TIMELINE_DATA });
      }

      // ===== FETCH RECENT ACTIVITIES =====
      const actRes = await api.get(`/timeline/assessments/${user.id}`, {
        params: { limit: 7 },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (actRes.data.status === 'success' && actRes.data.assessments) {
        setActivities(actRes.data.assessments);
      }

    } catch (error: any) {
      console.error('Error fetching timeline:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        toast.error('Failed to load timeline data');
        setHasAnyData(false);
        setTimelineData({ ...DEFAULT_TIMELINE_DATA });
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== BUILD MODULE DATA FROM API =====
  // Cards use `latest_module_scores` (matches Dashboard)
  // Graph uses per-period averages
  const buildModuleData = (data: any): TimelineData => {
    const result = { ...DEFAULT_TIMELINE_DATA };

    const labels = data.labels || [];
    const voiceScores = data.voice_scores || [];
    const memoryScores = data.memory_scores || [];
    const tremorScores = data.tremor_scores || [];
    const typingScores = data.typing_scores || [];
    const faceScores = data.face_scores || [];

    const latestModuleScores = data.latest_module_scores || {};
    const backendBaseline = data.baseline || {};

    const createModuleData = (
      scores: number[],
      latestScore: number,
      backendBaselineValue: number
    ): ModuleData => {
      const validScores = scores.filter(s => s > 0);
      const hasData = validScores.length > 0 || latestScore > 0;

      if (!hasData) {
        return {
          current: 0,
          baseline: 0,
          weekly: [],
          monthly: [],
          yearly: [],
          weekly_labels: [],
          monthly_labels: [],
          yearly_labels: [],
          hasData: false
        };
      }

      const baseline = backendBaselineValue > 0
        ? backendBaselineValue
        : (validScores.length > 0
            ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length * 100) / 100
            : 0);

      const current = latestScore > 0
        ? latestScore
        : (validScores.length > 0 ? validScores[validScores.length - 1] : 0);

      const weeklyLabels = labels.length > 0
        ? labels
        : validScores.map((_, i) => `Day ${i + 1}`);

      const monthlyLabels = labels.length > 0
        ? labels
        : validScores.map((_, i) => `Month ${i + 1}`);

      const yearlyLabels = labels.length > 0
        ? labels
        : validScores.map((_, i) => `Year ${i + 1}`);

      return {
        current: Math.round(current * 100) / 100,
        baseline: baseline,
        weekly: scores,
        monthly: scores,
        yearly: scores,
        weekly_labels: weeklyLabels,
        monthly_labels: monthlyLabels,
        yearly_labels: yearlyLabels,
        hasData: true
      };
    };

    result.voice = createModuleData(voiceScores, latestModuleScores.voice || 0, backendBaseline.voice || 0);
    result.memory = createModuleData(memoryScores, latestModuleScores.memory || 0, backendBaseline.memory || 0);
    result.tremor = createModuleData(tremorScores, latestModuleScores.tremor || 0, backendBaseline.tremor || 0);
    result.typing = createModuleData(typingScores, latestModuleScores.typing || 0, backendBaseline.typing || 0);
    result.face = createModuleData(faceScores, latestModuleScores.face || 0, backendBaseline.face || 0);

    return result;
  };

  // ===== REFRESH DATA =====
  const refreshData = () => {
    toast.success('🔄 Refreshing data...');
    fetchData();
  };

  // ===== CHART DATA =====
  const getChartData = () => {
    const module = timelineData[selectedModule as keyof TimelineData];
    const config = MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS];

    let labels: string[] = [];
    let data: number[] = [];

    if (!module.hasData) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: config.label,
            data: [0],
            borderColor: config.color,
            backgroundColor: config.color + '20',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: config.color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: 'All-Time Avg',
            data: [0],
            borderColor: '#94a3b8',
            borderDash: [6, 6],
            fill: false,
            pointRadius: 0,
            borderWidth: 2,
          }
        ]
      };
    }

    if (selectedPeriod === 'weekly') {
      labels = module.weekly_labels;
      data = module.weekly;
    } else if (selectedPeriod === 'monthly') {
      labels = module.monthly_labels;
      data = module.monthly;
    } else {
      labels = module.yearly_labels;
      data = module.yearly;
    }

    return {
      labels,
      datasets: [
        {
          label: config.label,
          data,
          borderColor: config.color,
          backgroundColor: config.color + '20',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: config.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: 'All-Time Avg',
          data: Array(data.length).fill(module.baseline),
          borderColor: '#94a3b8',
          borderDash: [6, 6],
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
        }
      ]
    };
  };

  // ===== CHART OPTIONS =====
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 500 as unknown as number },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 12,
        padding: 14,
        titleFont: { size: 13, weight: 600 as unknown as number },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#94a3b8', stepSize: 20 },
        title: {
          display: true,
          text: 'Score',
          color: '#94a3b8',
          font: { size: 11 },
        }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          maxRotation: 45,
          minRotation: 30,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  // ==================== HELPERS ====================
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getChangeColor = (current: number, baseline: number) => {
    if (baseline === 0) return 'text-slate-400';
    const diff = ((current - baseline) / baseline) * 100;
    if (diff > 0) return 'text-emerald-500';
    if (diff < 0) return 'text-red-500';
    return 'text-slate-400';
  };

  const getChangeIcon = (current: number, baseline: number) => {
    if (baseline === 0) return <FiMinus className="w-4 h-4" />;
    const diff = ((current - baseline) / baseline) * 100;
    if (diff > 0) return <FiTrendingUp className="w-4 h-4" />;
    if (diff < 0) return <FiTrendingDown className="w-4 h-4" />;
    return <FiMinus className="w-4 h-4" />;
  };

  const getChangePercentage = (current: number, baseline: number): string => {
    if (baseline === 0) return '0%';
    const diff = ((current - baseline) / baseline) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const getModuleData = (module: string) => {
    return timelineData[module as keyof TimelineData];
  };

  const getModuleIcon = (module: string) => {
    return MODULE_CONFIGS[module as keyof typeof MODULE_CONFIGS]?.icon || FiActivity;
  };

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800/30 rounded-full" />
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading timeline data...</p>
        </div>
      </div>
    );
  }

  // ==================== NO ASSESSMENTS UI ====================
  if (!hasAnyData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[70vh]"
      >
        <div className="text-center max-w-lg">
          <div className="relative inline-block">
            <div className="text-8xl mb-4 animate-float">📊</div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            No Timeline Data Yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Complete your first assessment to start tracking your brain health journey
            and see your cognitive timeline.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
            You need at least one completed assessment to view your timeline.
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
              onClick={refreshData}
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
            Cognitive Timeline
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track your brain health journey across time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            {viewMode === 'chart' ? <FiList className="w-5 h-5" /> : <FiGrid className="w-5 h-5" />}
          </button>
          <button
            onClick={refreshData}
            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            <FiRefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </motion.div>

      {/* ===== MODULE CARDS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {Object.entries(MODULE_CONFIGS).map(([key, config]) => {
          const data = getModuleData(key);
          const isActive = selectedModule === key;
          const Icon = config.icon;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden ${
                isActive
                  ? `bg-gradient-to-br from-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-50 to-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-100 dark:from-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-900/20 dark:to-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-900/30 border-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-500 shadow-lg shadow-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-500/20`
                  : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md`
              }`}
              onClick={() => setSelectedModule(key)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive
                    ? `bg-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-600 text-white`
                    : `bg-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-100 dark:bg-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-900/30 text-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-600`
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    {config.label}
                  </p>
                  {data.hasData ? (
                    <>
                      <p className={`text-lg font-bold ${getScoreColor(data.current)}`}>
                        {data.current}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                        Latest Test
                      </p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-slate-400">—</p>
                  )}
                </div>
              </div>
              {data.hasData && (
                <>
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    {getChangeIcon(data.current, data.baseline)}
                    <span className={getChangeColor(data.current, data.baseline)}>
                      {getChangePercentage(data.current, data.baseline)}
                    </span>
                    <span className="text-slate-400 ml-1">vs avg</span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-${key === 'voice' ? 'indigo' : key === 'memory' ? 'purple' : key === 'tremor' ? 'pink' : key === 'typing' ? 'teal' : 'amber'}-500 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(data.current, 100)}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ===== MAIN CHART SECTION ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            {(() => {
              const config = MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS];
              const Icon = config.icon;
              return (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: config.color + '20', color: config.color }}>
                  <Icon className="w-6 h-6" />
                </div>
              );
            })()}
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS].label}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS].label === 'Voice Analysis' ? 'Speech pattern & tone analysis' :
                 MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS].label === 'Memory Recall' ? 'Recall & cognitive function' :
                 MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS].label === 'Hand Tremor' ? 'Motor control & stability' :
                 MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS].label === 'Typing Pattern' ? 'Motor coordination & rhythm' :
                 'Emotional expression & symmetry'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              {isExpanded ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2 mb-4">
          {['weekly', 'monthly', 'yearly'].map((period) => {
            const config = MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS];
            const isActive = selectedPeriod === period;
            return (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? `text-white shadow-lg`
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
                style={isActive ? { backgroundColor: config.color, boxShadow: `0 4px 14px ${config.color}40` } : {}}
              >
                {period === 'weekly' && <FiClock className="w-4 h-4" />}
                {period === 'monthly' && <FiCalendar className="w-4 h-4" />}
                {period === 'yearly' && <FiTrendingUp className="w-4 h-4" />}
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div className={`${isExpanded ? 'h-[500px]' : 'h-[320px]'} transition-all duration-300`}>
          <Line data={getChartData()} options={chartOptions} />
        </div>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {(() => {
            const data = getModuleData(selectedModule);
            const config = MODULE_CONFIGS[selectedModule as keyof typeof MODULE_CONFIGS];
            return [
              { label: 'Latest Test', value: data.current, color: getScoreColor(data.current) },
              { label: 'All-Time Avg', value: data.baseline, color: 'text-slate-600 dark:text-slate-300' },
              {
                label: 'vs All-Time Avg',
                value: getChangePercentage(data.current, data.baseline),
                color: getChangeColor(data.current, data.baseline)
              },
              {
                label: `${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Average`,
                value: (() => {
                  const arr = selectedPeriod === 'weekly' ? data.weekly : selectedPeriod === 'monthly' ? data.monthly : data.yearly;
                  return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
                })(),
                color: 'text-slate-600 dark:text-slate-300'
              },
            ].map((stat, idx) => (
              <div key={idx} className="p-3 rounded-xl text-center" style={{ backgroundColor: config.color + '15' }}>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ));
          })()}
        </div>

        {/* Info Banner */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <div className="flex items-start gap-2">
            <FiInfo className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>Note:</strong> "Latest Test" shows your most recent individual score.
              The graph shows <strong>daily averages</strong> — all tests from each day
              averaged together. This is why the last point on the graph may differ
              from your Latest Test.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ===== RECENT ACTIVITIES ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <FiClock className="text-indigo-600" />
            Recent Assessments
          </h3>
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
              const config = MODULE_CONFIGS[activity.type as keyof typeof MODULE_CONFIGS];
              const Icon = config ? config.icon : FiActivity;
              const color = config ? config.color : '#6366f1';
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.4 }}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer`}
                  style={{
                    backgroundColor: color + '10',
                    borderColor: color + '30',
                  }}
                  onClick={() => setSelectedModule(activity.type)}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20', color: color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white capitalize">
                        {activity.module || activity.type} Assessment
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {activity.completed_at ? new Date(activity.completed_at).toLocaleDateString() : 'Recent'} • {activity.accuracy || 0}% accuracy
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Score</p>
                      <p className={`font-bold text-lg ${getScoreColor(activity.score || 0)}`}>
                        {activity.score || 0}
                      </p>
                    </div>
                    <FiChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>No recent activities</p>
            </div>
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
            <span className="font-medium text-slate-600 dark:text-slate-300">NeuroTwin AI</span>
          </div>
          <span>•</span>
          <span>Timeline</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{activities.length} assessments</span>
          <span>•</span>
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Timeline;