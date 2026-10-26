// frontend/src/pages/patient/DigitalTwin.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FiCpu, FiActivity, FiTrendingUp, FiTrendingDown, FiMinus,
  FiMic, FiCamera, FiType, FiHeart, FiEye, FiZap,
  FiAward, FiClock, FiBarChart2, FiUser, FiMail,
  FiCalendar, FiCheckCircle, FiAlertCircle, FiInfo,
  FiDownload, FiShare2, FiRefreshCw, FiArrowRight,
  FiStar, FiGlobe, FiLayers, FiTarget, FiCompass,
  FiDroplet, FiCloud, FiWind, FiThermometer,
  FiMaximize, FiMinimize, FiPlus
} from 'react-icons/fi';
import { Radar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js';
import api from '@/services/api';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ==================== INTERFACES ====================
interface ModuleMetric {
  current: number;
  baseline: number;
  range: [number, number];
  unit: string;
  trend: number[];
  hasData: boolean;
  labels: string[];
}

interface TwinData {
  voice: ModuleMetric;
  memory: ModuleMetric;
  tremor: ModuleMetric;
  typing: ModuleMetric;
  face: ModuleMetric;
}

// ==================== DEFAULT DATA ====================
const DEFAULT_MODULE_METRIC: ModuleMetric = {
  current: 0,
  baseline: 0,
  range: [0, 100],
  unit: '',
  trend: [],
  hasData: false,
  labels: []
};

const DEFAULT_TWIN_DATA: TwinData = {
  voice: { ...DEFAULT_MODULE_METRIC },
  memory: { ...DEFAULT_MODULE_METRIC },
  tremor: { ...DEFAULT_MODULE_METRIC },
  typing: { ...DEFAULT_MODULE_METRIC },
  face: { ...DEFAULT_MODULE_METRIC }
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
    apiKey: 'voice_scores',
    unit: 'Hz',
    range: [0, 100] as [number, number]
  },
  memory: {
    label: 'Memory Recall',
    icon: FiCpu,
    color: '#8b5cf6',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    apiKey: 'memory_scores',
    unit: '/100',
    range: [0, 100] as [number, number]
  },
  tremor: {
    label: 'Hand Tremor',
    icon: FiHeart,
    color: '#ec4899',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    apiKey: 'tremor_scores',
    unit: 'mm',
    range: [0, 100] as [number, number]
  },
  typing: {
    label: 'Typing Pattern',
    icon: FiType,
    color: '#14b8a6',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-800/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    apiKey: 'typing_scores',
    unit: 'ms',
    range: [0, 100] as [number, number]
  },
  face: {
    label: 'Facial Expression',
    icon: FiEye,
    color: '#f59e0b',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    apiKey: 'face_scores',
    unit: 'idx',
    range: [0, 100] as [number, number]
  }
};

// ==================== MAIN COMPONENT ====================
const DigitalTwin: React.FC = () => {
  const { user } = useAuth(); // ✅ Use user from AuthContext
  const [loading, setLoading] = useState(true);
  const [expandedChart, setExpandedChart] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [twinData, setTwinData] = useState<TwinData>({ ...DEFAULT_TWIN_DATA });
  const [patientId, setPatientId] = useState('NT-0001');
  const [lastSync, setLastSync] = useState('Just now');
  const [hasAnyData, setHasAnyData] = useState(false);

  // ===== INITIAL LOAD - DEPENDS ON USER =====
  useEffect(() => {
    if (user) {
      // Update patient ID from the reliable user object
      setPatientId(`NT-${String(user.id).padStart(4, '0')}`);
      fetchTwinData();
    } else {
      setLoading(false);
      setHasAnyData(false);
    }

    const interval = setInterval(() => {
      setLastSync('Just now');
    }, 30000);

    return () => clearInterval(interval);
  }, [user]); // ✅ Dependency on `user` - runs when user loads

  // ===== FETCH TWIN DATA FROM BACKEND =====
  const fetchTwinData = async () => {
    if (!user) return; // ✅ Guard clause

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found');
        setLoading(false);
        return;
      }

      // ✅ Use user.id directly
      const response = await api.get(`/timeline/data/${user.id}`, {
        params: { period: 'weekly' },
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📊 Digital Twin data:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        const data = response.data.data;
        const builtData = buildTwinData(data);
        setTwinData(builtData);

        const hasData = Object.values(builtData).some(m => m.hasData);
        setHasAnyData(hasData);

        setLastSync('Just now');
        toast.success('🔄 Digital Twin updated!');
      } else {
        setTwinData({ ...DEFAULT_TWIN_DATA });
        setHasAnyData(false);
      }

    } catch (error: any) {
      console.error('Error fetching twin data:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        toast.error('Failed to load twin data');
        setTwinData({ ...DEFAULT_TWIN_DATA });
        setHasAnyData(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // ===== BUILD TWIN DATA FROM API =====
  const buildTwinData = (data: any): TwinData => {
    const labels = data.labels || [];
    const voiceScores = data.voice_scores || [];
    const memoryScores = data.memory_scores || [];
    const tremorScores = data.tremor_scores || [];
    const typingScores = data.typing_scores || [];
    const faceScores = data.face_scores || [];

    const latestModuleScores = data.latest_module_scores || {};
    const backendBaseline = data.baseline || {};

    const createMetric = (
      scores: number[],
      module: string,
      latestScore: number,
      backendBaselineValue: number
    ): ModuleMetric => {
      const config = MODULE_CONFIGS[module as keyof typeof MODULE_CONFIGS];

      const validScores = scores.filter(s => s > 0);
      const hasData = validScores.length > 0 || latestScore > 0;

      if (!hasData) {
        return {
          current: 0,
          baseline: 0,
          range: [0, 100],
          unit: config?.unit || '',
          trend: [],
          hasData: false,
          labels: []
        };
      }

      const current = latestScore > 0
        ? latestScore
        : (validScores.length > 0 ? validScores[validScores.length - 1] : 0);

      const baseline = backendBaselineValue > 0
        ? backendBaselineValue
        : (validScores.length > 0
            ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length * 100) / 100
            : 0);

      const range: [number, number] = [0, 100];
      const unit = config?.unit || '';

      let trendLabels: string[] = [];

      if (labels.length === validScores.length) {
        trendLabels = [...labels];
      } else {
        if (validScores.length === 1) {
          trendLabels = ['Current'];
        } else if (validScores.length <= 4) {
          trendLabels = validScores.map((_, i) => `Day ${i + 1}`);
        } else {
          trendLabels = validScores.map((_, i) => `${i + 1}`);
        }
      }

      return {
        current: Math.round(current * 100) / 100,
        baseline: Math.round(baseline * 100) / 100,
        range: range,
        unit: unit,
        trend: validScores.map(v => Math.round(v * 100) / 100),
        hasData: true,
        labels: trendLabels
      };
    };

    return {
      voice: createMetric(voiceScores, 'voice', latestModuleScores.voice || 0, backendBaseline.voice || 0),
      memory: createMetric(memoryScores, 'memory', latestModuleScores.memory || 0, backendBaseline.memory || 0),
      tremor: createMetric(tremorScores, 'tremor', latestModuleScores.tremor || 0, backendBaseline.tremor || 0),
      typing: createMetric(typingScores, 'typing', latestModuleScores.typing || 0, backendBaseline.typing || 0),
      face: createMetric(faceScores, 'face', latestModuleScores.face || 0, backendBaseline.face || 0)
    };
  };

  // ==================== CHART CONFIGURATIONS ====================

  const radarData = {
    labels: ['Voice', 'Memory', 'Tremor', 'Typing', 'Face'],
    datasets: [
      {
        label: 'Current Performance',
        data: [
          twinData.voice.hasData ? twinData.voice.current : 0,
          twinData.memory.hasData ? twinData.memory.current : 0,
          twinData.tremor.hasData ? twinData.tremor.current : 0,
          twinData.typing.hasData ? twinData.typing.current : 0,
          twinData.face.hasData ? twinData.face.current : 0,
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        borderWidth: 3,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 9,
      },
      {
        label: 'Baseline',
        data: [
          twinData.voice.hasData ? twinData.voice.baseline : 0,
          twinData.memory.hasData ? twinData.memory.baseline : 0,
          twinData.tremor.hasData ? twinData.tremor.baseline : 0,
          twinData.typing.hasData ? twinData.typing.baseline : 0,
          twinData.face.hasData ? twinData.face.baseline : 0,
        ],
        backgroundColor: 'rgba(148, 163, 184, 0.1)',
        borderColor: '#94a3b8',
        borderWidth: 2,
        borderDash: [6, 6],
        pointBackgroundColor: '#94a3b8',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const radarOptions: ChartOptions<'radar'> = {
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
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(99, 102, 241, 0.1)',
          circular: true,
        },
        angleLines: {
          color: 'rgba(99, 102, 241, 0.15)',
        },
        pointLabels: {
          color: '#64748b',
          font: { size: 13, weight: 'bold' },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 25,
          font: { size: 13, weight: 500 },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 12,
        padding: 14,
      },
    },
  };

  // ==================== MODULE TREND CHART ====================
  const getTrendChartData = (module: string) => {
    const data = twinData[module as keyof TwinData];
    const config = MODULE_CONFIGS[module as keyof typeof MODULE_CONFIGS];

    if (!data.hasData || data.trend.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            label: config?.label || module.charAt(0).toUpperCase() + module.slice(1),
            data: [0],
            borderColor: config?.color || '#6366f1',
            backgroundColor: config?.color ? config.color + '20' : 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: config?.color || '#6366f1',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Baseline',
            data: [0],
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            borderWidth: 2,
          }
        ]
      };
    }

    const trendData = data.trend;
    const trendLabels = data.labels || trendData.map((_, i) => `${i + 1}`);
    const isSinglePoint = trendData.length === 1;

    return {
      labels: trendLabels,
      datasets: [
        {
          label: config?.label || module.charAt(0).toUpperCase() + module.slice(1),
          data: trendData,
          borderColor: config?.color || '#6366f1',
          backgroundColor: config?.color ? config.color + '20' : 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: config?.color || '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: isSinglePoint ? 8 : 5,
          pointHoverRadius: isSinglePoint ? 10 : 7,
          spanGaps: false,
        },
        {
          label: 'Baseline',
          data: Array(trendData.length).fill(data.baseline || 0),
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
        }
      ]
    };
  };

  const trendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 10,
          font: { size: 10 },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 8,
        padding: 10,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          color: '#94a3b8',
          stepSize: 20,
          callback: function (value: any) {
            return value;
          }
        },
        beginAtZero: true,
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 9 } },
      },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  // ==================== HELPERS ====================

  const getStatusColor = (current: number, baseline: number, range: [number, number], hasData: boolean) => {
    if (!hasData) return 'text-slate-400 dark:text-slate-500';

    const diff = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

    if (diff >= 0) {
      return 'text-emerald-600 dark:text-emerald-400';
    } else if (diff >= -10) {
      return 'text-amber-600 dark:text-amber-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusIcon = (current: number, baseline: number, hasData: boolean) => {
    if (!hasData) return <FiMinus className="w-4 h-4 text-slate-400" />;

    const diff = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

    if (Math.abs(diff) < 0.1) {
      return <FiMinus className="w-4 h-4 text-slate-400" />;
    }
    if (diff > 0) {
      return <FiTrendingUp className="w-4 h-4 text-emerald-500" />;
    }
    return <FiTrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getStatusDotColor = (current: number, baseline: number, hasData: boolean) => {
    if (!hasData) return 'bg-slate-400';

    const diff = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

    if (diff >= 0) {
      return 'bg-emerald-500';
    } else if (diff >= -10) {
      return 'bg-amber-500';
    } else {
      return 'bg-red-500';
    }
  };

  const getModuleIcon = (module: string) => {
    const icons: Record<string, any> = {
      voice: FiMic,
      memory: FiCpu,
      tremor: FiHeart,
      typing: FiType,
      face: FiEye,
    };
    return icons[module.toLowerCase()] || FiActivity;
  };

  const getModuleColor = (module: string) => {
    const colors: Record<string, string> = {
      voice: 'indigo',
      memory: 'purple',
      tremor: 'pink',
      typing: 'teal',
      face: 'amber',
    };
    return colors[module.toLowerCase()] || 'slate';
  };

  const getModuleDescription = (module: string) => {
    const desc: Record<string, string> = {
      voice: 'Speech pattern & tone analysis',
      memory: 'Recall & cognitive function',
      tremor: 'Motor control & stability',
      typing: 'Motor coordination & rhythm',
      face: 'Emotional expression & symmetry',
    };
    return desc[module.toLowerCase()] || '';
  };

  const formatPercentage = (current: number, baseline: number): string => {
    if (baseline === 0) return '—';
    const diff = ((current - baseline) / baseline) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const getProgressWidth = (value: number): number => {
    return Math.min(Math.max(value, 0), 100);
  };

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
            <div className="text-8xl mb-4 animate-float">🧠</div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            No Digital Twin Data Yet
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Complete your first assessment to create your personalized digital twin
            and start tracking your brain health journey.
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
              onClick={fetchTwinData}
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
  return (
    <div className="space-y-6">

      {/* ===== SECTION 2: EXPAND BUTTON ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-end gap-4"
      >
        <button
          onClick={() => setExpandedChart(!expandedChart)}
          className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2 text-sm"
        >
          {expandedChart ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
          <span className="text-slate-600 dark:text-slate-300">{expandedChart ? 'Collapse' : 'Expand'}</span>
        </button>
      </motion.div>

      {/* ===== SECTION 3: MAIN CHARTS ===== */}
      <div className={`grid ${expandedChart ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} gap-6`}>
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${expandedChart ? 'lg:col-span-1' : 'lg:col-span-1'} bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white">Neuro Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Multi-dimensional analysis</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full" />
              <span className="text-xs text-slate-500">Current</span>
              <span className="w-2 h-2 bg-slate-400 rounded-full ml-2" />
              <span className="text-xs text-slate-500">Baseline</span>
            </div>
          </div>
          <div className={`${expandedChart ? 'h-[500px]' : 'h-[400px]'} w-full`}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </motion.div>

        {/* Module Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`${expandedChart ? 'lg:col-span-2 grid grid-cols-2 gap-6' : 'lg:col-span-2 grid grid-cols-2 gap-4'}`}
        >
          {Object.entries(twinData).map(([key, data], index) => {
            const Icon = getModuleIcon(key);
            const color = getModuleColor(key);
            const statusColor = getStatusColor(data.current, data.baseline, data.range, data.hasData);
            const statusDot = getStatusDotColor(data.current, data.baseline, data.hasData);
            const isActive = activeMetric === key;
            const percentage = data.hasData && data.baseline > 0
              ? ((data.current - data.baseline) / data.baseline) * 100
              : 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border-2 transition-all cursor-pointer ${isActive
                    ? `border-${color}-500 shadow-lg shadow-${color}-500/20`
                    : 'border-slate-200 dark:border-slate-700 hover:shadow-lg'
                  }`}
                onClick={() => setActiveMetric(isActive ? null : key)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${color}-100 dark:bg-${color}-900/30 rounded-xl flex items-center justify-center text-${color}-600`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white capitalize">
                        {key}
                      </p>
                      <p className="text-[10px] text-slate-400">{getModuleDescription(key)}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${statusColor}`}>
                    {data.hasData ? formatPercentage(data.current, data.baseline) : '—'}
                  </div>
                </div>

                <div className="mt-3">
                  {data.hasData ? (
                    <>
                      <p className={`text-2xl font-bold ${statusColor}`}>
                        {data.current} <span className="text-sm text-slate-400">{data.unit}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>Baseline: {data.baseline} {data.unit}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span>Range: 0 - 100</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">No data available</p>
                  )}
                </div>

                <div className="mt-3 w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  {data.hasData ? (
                    <div
                      className={`h-full bg-${color}-500 rounded-full transition-all duration-1000`}
                      style={{
                        width: `${getProgressWidth(data.current)}%`
                      }}
                    />
                  ) : (
                    <div className="h-full bg-slate-300 dark:bg-slate-500 rounded-full" style={{ width: '0%' }} />
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                  <span className={`text-xs ${statusColor}`}>
                    {data.hasData ? (
                      percentage >= 0 ? 'Improved' : 'Declined'
                    ) : (
                      'No data'
                    )}
                  </span>
                </div>

                {/* ===== EXPANDED DETAILS ===== */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                    >
                      {data.hasData && data.trend.length > 0 ? (
                        <>
                          <div className="h-[140px]">
                            <Line
                              key={key}
                              data={getTrendChartData(key)}
                              options={trendOptions}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                            <span>{data.trend.length} assessment{data.trend.length > 1 ? 's' : ''}</span>
                            <span className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <span className="w-3 h-0.5 bg-indigo-500" />
                                Current
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed" />
                                Baseline
                              </span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-[100px] text-slate-400 text-sm">
                          No trend data available. Complete assessments to see trends.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ===== SECTION 4: CLINICAL CONTEXT ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
      >
        <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <FiInfo className="text-indigo-600" />
          Clinical Context
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your Digital Twin is a longitudinal physiological model constructed from{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">multi-modal assessment data</span>{' '}
              collected during your weekly assessments. Current profile shows{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">stable</span> performance
              across all modules.
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              We utilize <span className="font-bold text-purple-600 dark:text-purple-400">AI-driven pattern analysis</span>{' '}
              to differentiate between natural variance and clinical neurological shifts.
              Your current week shows <span className="font-bold text-emerald-600 dark:text-emerald-400">stable</span> patterns
              within clinical thresholds.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ===== SECTION 5: MODULE STATUS OVERVIEW ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
      >
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <FiActivity className="text-indigo-600" />
          Module Status Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(twinData).map(([key, data]) => {
            const color = getModuleColor(key);
            const statusColor = getStatusColor(data.current, data.baseline, data.range, data.hasData);
            const statusDot = getStatusDotColor(data.current, data.baseline, data.hasData);
            const percentage = data.hasData && data.baseline > 0
              ? ((data.current - data.baseline) / data.baseline) * 100
              : 0;

            return (
              <div key={key} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-center border border-slate-200 dark:border-slate-600">
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{key}</p>
                {data.hasData ? (
                  <>
                    <p className={`text-lg font-bold ${statusColor}`}>{data.current}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                      <span className={`text-[10px] font-medium ${statusColor}`}>
                        {percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-400">—</p>
                    <span className="text-[10px] text-slate-400">No data</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ===== SECTION 6: FOOTER ===== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiCpu className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-medium text-slate-600 dark:text-slate-300">NeuroTwin AI</span>
            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full">PRO</span>
          </div>
          <span>•</span>
          <span>Clinical Digital Twin</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Patient ID: {patientId}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
          <span>•</span>
          <span>Last Sync: {lastSync}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default DigitalTwin;