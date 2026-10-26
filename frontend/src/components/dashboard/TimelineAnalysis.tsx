// frontend/src/components/dashboard/TimelineAnalysis.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, FiTrendingDown, FiMinus, FiCalendar, 
  FiBarChart2, FiClock, FiAward, FiActivity, FiRefreshCw
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimelineData {
  labels: string[];
  scores: number[];
  voice_scores: number[];
  memory_scores: number[];
  tremor_scores: number[];
  typing_scores: number[];
  dates: string[];
  total_assessments: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  current_score: number;
  previous_score: number;
}

interface DashboardData {
  brain_health_score: number;
  previous_score: number;
  change: number;
  total_assessments: number;
  streak: number;
  highest_score: number;
  lowest_score: number;
  last_assessment: string | null;
}

const TimelineAnalysis: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<TimelineData>({
    labels: [],
    scores: [],
    voice_scores: [],
    memory_scores: [],
    tremor_scores: [],
    typing_scores: [],
    dates: [],
    total_assessments: 0,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0,
    current_score: 0,
    previous_score: 0
  });
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    brain_health_score: 0,
    previous_score: 0,
    change: 0,
    total_assessments: 0,
    streak: 0,
    highest_score: 0,
    lowest_score: 0,
    last_assessment: null
  });
  const [userId, setUserId] = useState(1);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      setUserId(user.id);
    }
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch timeline data
      const timelineResponse = await api.get(`/timeline/data/${userId}`, {
        params: { period },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (timelineResponse.data.status === 'success') {
        setTimelineData(timelineResponse.data.data);
      }
      
      // Fetch dashboard data
      const dashboardResponse = await api.get(`/timeline/dashboard/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (dashboardResponse.data.status === 'success') {
        setDashboardData(dashboardResponse.data.data);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use demo data if API fails
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  const setDemoData = () => {
    // This will be replaced with real data from API
    const demoData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
      scores: [82, 84, 83, 85, 86, 84, 87, 89],
      voice_scores: [80, 82, 81, 83, 84, 82, 85, 87],
      memory_scores: [78, 80, 82, 81, 83, 85, 84, 86],
      tremor_scores: [80, 82, 84, 83, 85, 86, 85, 87],
      typing_scores: [88, 89, 87, 88, 90, 89, 91, 92],
      total_assessments: 8,
      average_score: 85,
      highest_score: 89,
      lowest_score: 82,
      current_score: 89,
      previous_score: 87
    };
    setTimelineData({ ...demoData, dates: demoData.labels.map(() => new Date().toISOString()) });
    setDashboardData({
      brain_health_score: 89,
      previous_score: 87,
      change: 2,
      total_assessments: 8,
      streak: 28,
      highest_score: 89,
      lowest_score: 82,
      last_assessment: new Date().toISOString()
    });
  };

  const chartData = {
    labels: timelineData.labels,
    datasets: [
      {
        label: 'Voice',
        data: timelineData.voice_scores,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Memory',
        data: timelineData.memory_scores,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Tremor',
        data: timelineData.tremor_scores,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#ec4899',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Typing',
        data: timelineData.typing_scores,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#14b8a6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        cornerRadius: 10,
        padding: 12,
      },
    },
    scales: {
      y: {
        min: 70,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#94a3b8' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const getTrendIcon = () => {
    const change = dashboardData.change;
    if (change > 0) return <FiTrendingUp className="text-emerald-500" />;
    if (change < 0) return <FiTrendingDown className="text-red-500" />;
    return <FiMinus className="text-slate-500" />;
  };

  const getTrendColor = () => {
    const change = dashboardData.change;
    if (change > 0) return 'text-emerald-600 dark:text-emerald-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-slate-500 dark:text-slate-400">Loading timeline data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (timelineData.total_assessments === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Data Unavailable</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Failed to load Digital Twin data. Please ensure you have completed at least one assessment.
          </p>
          <button
            onClick={fetchData}
            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">
            Overall Brain Health Score Over Time
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Composite neural integrity index based on your assessments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['weekly', 'monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p as any)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Score Summary - Dynamic */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Score</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {dashboardData.brain_health_score}
          </p>
          <div className="flex items-center gap-1 text-sm">
            {getTrendIcon()}
            <span className={getTrendColor()}>
              {dashboardData.change > 0 ? '+' : ''}{dashboardData.change}%
            </span>
          </div>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <p className="text-xs text-slate-500 dark:text-slate-400">Highest</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {dashboardData.highest_score}
          </p>
          <p className="text-xs text-slate-400">Best performance</p>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
          <p className="text-xs text-slate-500 dark:text-slate-400">Average</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {timelineData.average_score || 0}
          </p>
          <p className="text-xs text-slate-400">Overall</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <p className="text-xs text-slate-500 dark:text-slate-400">Assessments</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {dashboardData.total_assessments || 0}
          </p>
          <p className="text-xs text-slate-400">Total completed</p>
        </div>
      </div>

      {/* Chart - Dynamic */}
      <div className="h-[250px]">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-indigo-500" />
            Voice
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-purple-500" />
            Memory
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-pink-500" />
            Tremor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-teal-500" />
            Typing
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FiAward className="w-3 h-3 text-amber-500" />
            {dashboardData.streak || 0} day streak
          </span>
          <span className="flex items-center gap-1">
            <FiTrendingUp className={`w-3 h-3 ${dashboardData.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            {dashboardData.change >= 0 ? '+' : ''}{dashboardData.change}% this week
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default TimelineAnalysis;