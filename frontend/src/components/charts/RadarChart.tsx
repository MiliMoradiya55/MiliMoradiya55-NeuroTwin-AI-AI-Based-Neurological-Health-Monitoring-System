// src/components/charts/RadarChart.tsx
import React from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  data: any;
  options?: any;
  height?: number;
}

const RadarChart: React.FC<RadarChartProps> = ({ data, options, height = 250 }) => {
  const defaultOptions = {
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
        },
        grid: {
          color: 'rgba(99, 102, 241, 0.1)',
        },
        pointLabels: {
          color: '#64748b',
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 11 },
          color: '#64748b',
        },
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div style={{ height: `${height}px` }}>
      <Radar data={data} options={mergedOptions} />
    </div>
  );
};

export default RadarChart;