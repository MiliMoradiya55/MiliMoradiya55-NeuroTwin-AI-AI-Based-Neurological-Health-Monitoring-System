import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

interface BrainHealthChartProps {
  score: number;
  change: number;
}

const BrainHealthChart: React.FC<BrainHealthChartProps> = ({ score, change }) => {
  const [view, setView] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Voice',
        data: [82, 84, 83, 85, 86, 84, 87, 86, 88, 87, 86, 85],
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
        data: [78, 80, 82, 81, 83, 85, 84, 86, 85, 84, 83, 82],
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
        data: [80, 82, 84, 83, 85, 86, 85, 87, 86, 88, 87, 86],
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
        data: [88, 89, 87, 88, 90, 89, 91, 90, 92, 91, 90, 89],
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#14b8a6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const options = {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">
            Overall Brain Health Score Over Time
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Composite neural integrity index based on multi-modal twin data
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['weekly', 'monthly', 'yearly'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                view === v
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px]">
        <Line data={data} options={options} />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-slate-500 dark:text-slate-400">Current Score:</span>
          <span className="font-bold text-2xl text-slate-800 dark:text-white">{score}</span>
          <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)} points from last week
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded-full" />Voice</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full" />Memory</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-pink-500 rounded-full" />Tremor</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-teal-500 rounded-full" />Typing</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BrainHealthChart;