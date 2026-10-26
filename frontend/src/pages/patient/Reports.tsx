// frontend/src/pages/patient/DigitalTwinReport.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  FiCpu, FiActivity, FiTrendingUp, FiTrendingDown, FiMinus,
  FiMic, FiType, FiHeart, FiEye, FiZap,
  FiDownload, FiRefreshCw, FiFileText,
  FiBarChart2, FiCalendar, FiChevronLeft, FiChevronRight,
  FiCompass, FiLoader
} from 'react-icons/fi';
import { Line, Doughnut } from 'react-chartjs-2';
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
  Filler
} from 'chart.js';
import api from '@/services/api';
import toast from 'react-hot-toast';
import SHAPExplanation from '@/components/SHAPExplanation';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  RadialLinearScale, ArcElement, Title, Tooltip, Legend, Filler
);

// ==================== INTERFACES ====================
interface MonthlyDataPoint {
  label: string;
  score: number;
}

interface ModuleScore {
  name: string;
  key: string;
  current: number;
  baseline: number;
  range: [number, number];
  unit: string;
  trend: number[];
  trendLabels: string[];
  monthlyData: MonthlyDataPoint[];
  description: string;
  interpretation: string;
  hasData: boolean;
}

interface PatientInfo {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  address: string;
}

interface ReportData {
  patientId: string;
  patientName: string;
  patient: PatientInfo;
  dateGenerated: string;
  overallScore: number;
  baselineScore: number;
  changePercent: number;
  changePoints: number;
  overallStatus: string;
  totalDataPoints: number;
  assessmentPeriod: string;
  modules: ModuleScore[];
}

// ==================== MODULE CONFIG ====================
const MODULE_CONFIGS = [
  {
    key: 'voice',
    name: 'Voice',
    icon: FiMic,
    unit: 'Hz',
    range: [60, 100] as [number, number],
    color: '#6366f1',
    description: 'Speech pattern & tone analysis measuring vocal stability and modulation.'
  },
  {
    key: 'memory',
    name: 'Memory',
    icon: FiCpu,
    unit: '/10',
    range: [0, 10] as [number, number],
    color: '#8b5cf6',
    description: 'Recall & cognitive function assessment through standardized memory tests.'
  },
  {
    key: 'tremor',
    name: 'Tremor',
    icon: FiHeart,
    unit: 'mm',
    range: [0, 0.25] as [number, number],
    color: '#ec4899',
    description: 'Motor control & stability measured through fine motor tasks.'
  },
  {
    key: 'typing',
    name: 'Typing',
    icon: FiType,
    unit: 'ms',
    range: [30, 60] as [number, number],
    color: '#14b8a6',
    description: 'Motor coordination & rhythm evaluated through typing speed and accuracy.'
  },
  {
    key: 'face',
    name: 'Face',
    icon: FiEye,
    unit: 'idx',
    range: [0.85, 1.00] as [number, number],
    color: '#f59e0b',
    description: 'Emotional expression & facial symmetry analysis.'
  }
];

// ==================== MAIN COMPONENT ====================
const DigitalTwinReport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [hasAssessments, setHasAssessments] = useState(false);

  // ===== INITIAL LOAD =====
  useEffect(() => {
    if (user) {
      generateReportData();
    } else {
      setLoading(false);
      setHasAssessments(false);
    }
  }, [user]);

  // ===== FETCH DATA FROM BACKEND =====
  const generateReportData = async () => {
    if (!user) return;

    setLoading(true);
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setIsGenerating(false);
        return;
      }

      // Check status
      const statusRes = await api.get(`/timeline/status/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statusRes.data.status === 'success' && statusRes.data.data) {
        const hasData = statusRes.data.data.has_assessments;
        setHasAssessments(hasData);

        if (!hasData) {
          setLoading(false);
          setIsGenerating(false);
          setReportData(null);
          return;
        }
      }

      // Fetch full user profile for report
      let fullUserProfile: any = null;
      try {
        const meRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meRes.data) {
          fullUserProfile = meRes.data;
        }
      } catch (err) {
        console.warn('Could not fetch full user profile, falling back to auth context', err);
      }

      // Brain health
      const brainRes = await api.get(`/timeline/brain-health/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const brainHealthData = brainRes.data.status === 'success'
        ? brainRes.data.data
        : { brain_health_score: 0, baseline_brain_health: 0, modules: {}, baseline: {}, change_percent: 0, change_points: 0 };

      // Timeline
      const timelineRes = await api.get(`/timeline/data/${user.id}`, {
        params: { period: 'monthly' },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (timelineRes.data.status === 'success' && timelineRes.data.data) {
        const timelineData = timelineRes.data.data;

        const allScores = [
          ...(timelineData.voice_scores || []),
          ...(timelineData.memory_scores || []),
          ...(timelineData.tremor_scores || []),
          ...(timelineData.typing_scores || []),
          ...(timelineData.face_scores || [])
        ];

        const hasRealData = allScores.some((s: number) => s > 0);

        if (hasRealData) {
          const builtReportData = buildReportData(timelineData, brainHealthData, fullUserProfile);
          setReportData(builtReportData);
          setHasAssessments(true);
          toast.success('📊 Report generated successfully!');
        } else {
          setHasAssessments(false);
          setReportData(null);
          toast('No assessment data found.');
        }
      } else {
        setHasAssessments(false);
        setReportData(null);
      }

    } catch (error: any) {
      console.error('Error generating report:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        toast.error('Failed to generate report');
        setHasAssessments(false);
        setReportData(null);
      }
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  // ===== BUILD REPORT DATA =====
  const buildReportData = (
    timelineData: any,
    brainHealthData: any,
    fullUserProfile: any
  ): ReportData => {
    const patientId = `NT-${String(user?.id || '0001').padStart(4, '0')}`;
    const patientName = fullUserProfile?.name || user?.name || 'Patient';

    const labels = timelineData.labels || [];
    const voiceScores = timelineData.voice_scores || [];
    const memoryScores = timelineData.memory_scores || [];
    const tremorScores = timelineData.tremor_scores || [];
    const typingScores = timelineData.typing_scores || [];
    const faceScores = timelineData.face_scores || [];

    const allScoresMap: Record<string, number[]> = {
      voice: voiceScores,
      memory: memoryScores,
      tremor: tremorScores,
      typing: typingScores,
      face: faceScores
    };

    const modules: ModuleScore[] = MODULE_CONFIGS.map((config) => {
      const scores = allScoresMap[config.key] || [];
      const validScores = scores.filter((s: number) => s > 0);
      const hasData = validScores.length > 0;

      const current = (brainHealthData.modules && brainHealthData.modules[config.key]) || 0;
      const baseline = (brainHealthData.baseline && brainHealthData.baseline[config.key]) || 0;

      if (!hasData && current === 0) {
        return {
          name: config.name,
          key: config.key,
          current: 0,
          baseline: 0,
          range: config.range,
          unit: config.unit,
          trend: [],
          trendLabels: [],
          monthlyData: [],
          description: config.description,
          interpretation: 'No data available for this module.',
          hasData: false
        };
      }

      let trendLabels: string[] = [];
      if (labels.length === scores.length) {
        trendLabels = [...labels];
      } else {
        trendLabels = scores.map((_: number, i: number) => `Period ${i + 1}`);
      }

      const trend: number[] = [];
      const filteredTrendLabels: string[] = [];
      scores.forEach((score: number, i: number) => {
        if (score > 0) {
          trend.push(Math.round(score * 100) / 100);
          filteredTrendLabels.push(trendLabels[i] || `P${i + 1}`);
        }
      });

      const monthlyData = trend.map((score, index) => ({
        label: filteredTrendLabels[index] || `${index + 1}`,
        score: score
      }));

      let interpretation = '';
      if (baseline > 0) {
        const diff = ((current - baseline) / baseline) * 100;
        if (diff > 5) {
          interpretation = `${config.name} shows significant improvement of ${diff.toFixed(1)}% from baseline.`;
        } else if (diff > 0) {
          interpretation = `${config.name} shows slight improvement of ${diff.toFixed(1)}% from baseline.`;
        } else if (diff > -5) {
          interpretation = `${config.name} remains stable with minimal change from baseline.`;
        } else {
          interpretation = `${config.name} shows a decline of ${Math.abs(diff).toFixed(1)}% from baseline. Further assessment recommended.`;
        }
      } else {
        interpretation = `${config.name} data collected. Baseline will be established after more assessments.`;
      }

      return {
        name: config.name,
        key: config.key,
        current: Math.round(current * 100) / 100,
        baseline: Math.round(baseline * 100) / 100,
        range: config.range,
        unit: config.unit,
        trend,
        trendLabels: filteredTrendLabels,
        monthlyData,
        description: config.description,
        interpretation,
        hasData: true
      };
    });

    const overallScore = brainHealthData.brain_health_score || 0;
    const baselineScore = brainHealthData.baseline_brain_health || 0;
    const changePercent = brainHealthData.change_percent || 0;
    const changePoints = brainHealthData.change_points || 0;

    let overallStatus = 'Stable';
    if (changePercent > 3) {
      overallStatus = 'Improving';
    } else if (changePercent < -3) {
      overallStatus = 'Declining';
    } else if (overallScore === 0) {
      overallStatus = 'No Data';
    }

    const totalDataPoints = modules.reduce(
      (sum, m) => sum + (m.trend.length * 1000),
      0
    );

    const maxDataPoints = Math.max(...modules.map(m => m.trend.length), 0);
    const assessmentPeriod = maxDataPoints > 1
      ? `${maxDataPoints} Month${maxDataPoints > 1 ? 's' : ''}`
      : maxDataPoints === 1
        ? '1 Month'
        : 'No data';

    // Build patient info for report
    const patientInfo: PatientInfo = {
      name: fullUserProfile?.name || user?.name || 'N/A',
      email: fullUserProfile?.email || user?.email || 'N/A',
      phone: fullUserProfile?.phone || 'N/A',
      age: fullUserProfile?.age ? `${fullUserProfile.age} years` : 'N/A',
      gender: fullUserProfile?.gender
        ? fullUserProfile.gender.charAt(0).toUpperCase() + fullUserProfile.gender.slice(1)
        : 'N/A',
      address: fullUserProfile?.address || 'N/A',
    };

    return {
      patientId,
      patientName,
      patient: patientInfo,
      dateGenerated: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      overallScore,
      baselineScore,
      changePercent,
      changePoints,
      overallStatus,
      totalDataPoints,
      assessmentPeriod,
      modules
    };
  };

  // ===== HANDLERS =====
  const handleGenerateReport = async () => {
    if (isGenerating) return;
    await generateReportData();
  };

  // ============================================================
  // DOWNLOAD REPORT AS PDF
  // ============================================================
  const handleDownload = async () => {
    if (!reportData || isDownloading) return;
    setIsDownloading(true);

    try {
      const html = buildPrintableHTML(reportData);

      const printWindow = window.open('', '_blank', 'width=900,height=1200');
      if (!printWindow) {
        toast.error('Popup blocked. Please allow popups to download the report.');
        setIsDownloading(false);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 800);
      };

      toast.success('📄 Report ready — choose "Save as PDF" in the print dialog.');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to prepare report download.');
    } finally {
      setIsDownloading(false);
    }
  };

  // ============================================================
  // BUILD PRINTABLE HTML (2 pages)
  // ============================================================
  const buildPrintableHTML = (data: ReportData): string => {
    // --- Patient Info Rows ---
    const patientRows = `
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Full Name</div>
          <div class="info-value">${data.patient.name}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email Address</div>
          <div class="info-value">${data.patient.email}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Mobile Number</div>
          <div class="info-value">${data.patient.phone}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Age</div>
          <div class="info-value">${data.patient.age}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Gender</div>
          <div class="info-value">${data.patient.gender}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date of Report</div>
          <div class="info-value">${data.dateGenerated}</div>
        </div>
        <div class="info-item info-item-wide">
          <div class="info-label">Address</div>
          <div class="info-value">${data.patient.address}</div>
        </div>
      </div>
    `;

    // --- Module Rows Page 1 ---
    const moduleRowsPage1 = data.modules
      .map((m) => {
        if (!m.hasData) {
          return `
            <div class="module no-data">
              <div class="module-header">
                <span class="module-name">${m.name}</span>
                <span class="no-data-badge">No data</span>
              </div>
              <p class="module-desc">${m.description}</p>
            </div>
          `;
        }
        const diff = m.baseline > 0 ? ((m.current - m.baseline) / m.baseline) * 100 : 0;
        const diffColor = diff >= 0 ? '#059669' : '#dc2626';
        const diffSign = diff >= 0 ? '+' : '';
        return `
          <div class="module">
            <div class="module-header">
              <span class="module-name">${m.name}</span>
              <span class="module-change" style="color:${diffColor}">${diffSign}${diff.toFixed(1)}%</span>
            </div>
            <p class="module-desc">${m.description}</p>
            <div class="module-metrics">
              <div class="metric"><span class="metric-label">Current</span><span class="metric-value">${m.current} ${m.unit}</span></div>
              <div class="metric"><span class="metric-label">Baseline</span><span class="metric-value">${m.baseline} ${m.unit}</span></div>
              <div class="metric"><span class="metric-label">Data Points</span><span class="metric-value">${m.trend.length}</span></div>
            </div>
            <p class="module-interp"><strong>Interpretation:</strong> ${m.interpretation}</p>
          </div>
        `;
      })
      .join('');

    // --- Trend Charts Page 2 ---
    const trendChartsPage2 = data.modules
      .map((m) => {
        if (!m.hasData || m.trend.length === 0) {
          return `
            <div class="trend-card">
              <div class="trend-header"><span class="trend-name">${m.name}</span><span class="trend-unit">${m.unit}</span></div>
              <p class="trend-empty">No trend data available. Complete more assessments to see trends.</p>
            </div>
          `;
        }

        const width = 480;
        const height = 160;
        const padding = 30;
        const chartW = width - padding * 2;
        const chartH = height - padding * 2;

        const values = m.trend;
        const minV = Math.min(...values, m.baseline || 0);
        const maxV = Math.max(...values, m.baseline || 0, 1);
        const rangeV = maxV - minV || 1;

        const points = values.map((v, i) => {
          const x = padding + (i / Math.max(values.length - 1, 1)) * chartW;
          const y = padding + chartH - ((v - minV) / rangeV) * chartH;
          return { x, y, v };
        });

        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        const baselineY =
          m.baseline > 0
            ? padding + chartH - ((m.baseline - minV) / rangeV) * chartH
            : null;

        const dots = points
          .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#ffffff" stroke="#6366f1" stroke-width="2" />`)
          .join('');

        const xLabels = m.trendLabels
          .slice(0, 6)
          .map((label, i) => {
            const p = points[i];
            if (!p) return '';
            return `<text x="${p.x}" y="${height - 8}" font-size="9" fill="#94a3b8" text-anchor="middle">${label}</text>`;
          })
          .join('');

        const baselineLine = baselineY
          ? `<line x1="${padding}" y1="${baselineY}" x2="${padding + chartW}" y2="${baselineY}" stroke="#94a3b8" stroke-dasharray="4,4" stroke-width="1.5" />`
          : '';

        return `
          <div class="trend-card">
            <div class="trend-header">
              <span class="trend-name">${m.name}</span>
              <span class="trend-unit">${m.unit} • ${m.trend.length} data points</span>
            </div>
            <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="${width}" height="${height}" fill="#fafafa" />
              <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + chartH}" stroke="#e2e8f0" />
              <line x1="${padding}" y1="${padding + chartH}" x2="${padding + chartW}" y2="${padding + chartH}" stroke="#e2e8f0" />
              ${baselineLine}
              <path d="${pathD}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
              ${dots}
              ${xLabels}
              <text x="${padding - 6}" y="${padding + 4}" font-size="9" fill="#94a3b8" text-anchor="end">${maxV.toFixed(1)}</text>
              <text x="${padding - 6}" y="${padding + chartH}" font-size="9" fill="#94a3b8" text-anchor="end">${minV.toFixed(1)}</text>
            </svg>
            <div class="trend-stats">
              <span>Min: ${Math.min(...values).toFixed(2)}</span>
              <span>Max: ${Math.max(...values).toFixed(2)}</span>
              <span>Avg: ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}</span>
            </div>
          </div>
        `;
      })
      .join('');

    const trendBadges = data.modules
      .filter((m) => m.hasData)
      .map((m) => {
        const diff = m.baseline > 0 ? ((m.current - m.baseline) / m.baseline) * 100 : 0;
        const isPositive = diff >= 0;
        return `<span class="badge ${isPositive ? 'badge-up' : 'badge-down'}">${isPositive ? '↑' : '↓'} ${m.name}: ${isPositive ? '+' : ''}${diff.toFixed(1)}%</span>`;
      })
      .join('');

    let summaryText = '';
    if (data.changePercent >= 3) {
      summaryText = `Overall brain health shows <strong style="color:#059669">positive improvement</strong> of ${data.changePercent}% from baseline.`;
    } else if (data.changePercent <= -3) {
      summaryText = `Overall brain health shows a <strong style="color:#dc2626">decline</strong> of ${Math.abs(data.changePercent)}% from baseline.`;
    } else {
      summaryText = `Overall brain health remains <strong style="color:#d97706">stable</strong> compared to baseline.`;
    }

    // ---------- FINAL HTML ----------
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>NeuroTwin AI - Clinical Digital Twin Report</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 16mm 14mm;
      page-break-after: always;
      background: #ffffff;
      position: relative;
    }
    .page:last-child { page-break-after: auto; }

    /* ---------- HEADER ---------- */
    .header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
      color: #ffffff;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 18px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .brand-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255,255,255,0.22);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
    }
    .brand-text h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.2px; }
    .brand-text p { margin: 2px 0 0; font-size: 11px; opacity: 0.9; }
    .report-tag {
      background: rgba(255,255,255,0.2);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-meta {
      font-size: 11px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.22);
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      opacity: 0.95;
    }

    /* ---------- PATIENT INFO ---------- */
    .patient-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 18px;
    }
    .patient-section-title {
      font-size: 12px;
      font-weight: 800;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #e0e7ff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
    }
    .info-item { font-size: 12px; }
    .info-item-wide { grid-column: 1 / -1; }
    .info-label {
      font-size: 10px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 13px;
      color: #1e293b;
      font-weight: 600;
      word-break: break-word;
    }

    /* ---------- SECTION TITLES ---------- */
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #1e293b;
      margin: 18px 0 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ---------- OVERALL SCORE CARD ---------- */
    .overall-card {
      display: flex;
      gap: 20px;
      align-items: center;
      background: linear-gradient(135deg, #eef2ff, #faf5ff);
      border: 1px solid #c7d2fe;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 16px;
    }
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 8px solid #c7d2fe;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #ffffff;
    }
    .score-circle .score-value { font-size: 30px; font-weight: 800; color: #6366f1; line-height: 1; }
    .score-circle .score-label { font-size: 10px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .overall-stats { flex: 1; }
    .overall-stats h3 { margin: 0 0 4px; font-size: 15px; color: #1e293b; }
    .overall-stats .sub { font-size: 11px; color: #64748b; margin-bottom: 12px; }
    .overall-stats .stats-row { display: flex; gap: 28px; }
    .overall-stats .stats-row .stat { font-size: 12px; }
    .overall-stats .stats-row .stat .lbl { color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    .overall-stats .stats-row .stat .val { font-weight: 800; font-size: 16px; margin-top: 2px; }
    .status-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ---------- MODULES ---------- */
    .module {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 10px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .module.no-data { background: #f8fafc; }
    .module-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .module-name { font-weight: 800; font-size: 13px; text-transform: capitalize; color: #1e293b; }
    .module-change { font-size: 12px; font-weight: 800; }
    .no-data-badge { font-size: 10px; background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 999px; font-weight: 700; }
    .module-desc { font-size: 11px; color: #64748b; margin: 2px 0 8px; }
    .module-metrics { display: flex; gap: 24px; margin-bottom: 8px; }
    .metric { font-size: 11px; }
    .metric .metric-label { display: block; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
    .metric .metric-value { font-weight: 700; color: #1e293b; }
    .module-interp { font-size: 11px; color: #475569; margin: 0; line-height: 1.5; }

    /* ---------- TREND CARDS ---------- */
    .trend-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .trend-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .trend-name { font-weight: 800; font-size: 13px; text-transform: capitalize; color: #1e293b; }
    .trend-unit { font-size: 10px; color: #94a3b8; font-weight: 600; }
    .trend-empty { font-size: 11px; color: #94a3b8; padding: 20px 0; text-align: center; margin: 0; }
    .trend-stats {
      display: flex; justify-content: space-between;
      font-size: 10px; color: #64748b; margin-top: 6px; font-weight: 600;
    }

    /* ---------- SUMMARY BOX ---------- */
    .summary-box {
      background: linear-gradient(135deg, #eef2ff, #f5f3ff);
      border: 1px solid #c7d2fe;
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 16px;
    }
    .summary-box h3 { margin: 0 0 6px; font-size: 14px; color: #1e293b; }
    .summary-box p { font-size: 12px; margin: 0 0 10px; color: #334155; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge { font-size: 10px; padding: 4px 10px; border-radius: 999px; font-weight: 700; }
    .badge-up { background: #d1fae5; color: #065f46; }
    .badge-down { background: #fee2e2; color: #991b1b; }

    /* ---------- FOOTER ---------- */
    .footer {
      position: absolute;
      bottom: 8mm;
      left: 14mm;
      right: 14mm;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      font-weight: 600;
    }
    .footer .brand { display: flex; align-items: center; gap: 6px; color: #475569; }
    .footer .brand-dot {
      width: 14px; height: 14px; border-radius: 4px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 12mm 12mm; }
      .header { border-radius: 8px; }
    }
  </style>
</head>
<body>

  <!-- ============ PAGE 1: ASSESSMENT SUMMARY ============ -->
  <div class="page">
    <!-- Report Header -->
    <div class="header">
      <div class="header-top">
        <div class="brand-block">
          <div class="brand-logo">N</div>
          <div class="brand-text">
            <h1>NeuroTwin AI</h1>
            <p>Clinical Digital Twin Report</p>
          </div>
        </div>
        <div class="report-tag">Confidential</div>
      </div>
      <div class="header-meta">
        <span><strong>Report ID:</strong> RPT-${data.patientId}</span>
        <span><strong>Generated:</strong> ${data.dateGenerated}</span>
        <span><strong>Patient ID:</strong> ${data.patientId}</span>
      </div>
    </div>

    <!-- Patient Information -->
    <div class="patient-section">
      <div class="patient-section-title">👤 Patient Information</div>
      ${patientRows}
    </div>

    <!-- Assessment Summary -->
    <div class="section-title">📊 Assessment Summary</div>

    <div class="overall-card">
      <div class="score-circle">
        <span class="score-value">${data.overallScore}</span>
        <span class="score-label">Score</span>
      </div>
      <div class="overall-stats">
        <h3>Overall Brain Health — <span style="text-transform:capitalize">${data.overallStatus}</span></h3>
        <p class="sub">Latest assessment aggregated from all 5 modules</p>
        <div class="stats-row">
          <div class="stat">
            <div class="lbl">Baseline</div>
            <div class="val">${data.baselineScore}</div>
          </div>
          <div class="stat">
            <div class="lbl">Change</div>
            <div class="val" style="color:${data.changePercent >= 0 ? '#059669' : '#dc2626'}">
              ${data.changePercent >= 0 ? '+' : ''}${data.changePercent}%
            </div>
          </div>
          <div class="stat">
            <div class="lbl">Points</div>
            <div class="val" style="color:${data.changePoints >= 0 ? '#059669' : '#dc2626'}">
              ${data.changePoints >= 0 ? '+' : ''}${data.changePoints}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section-title">🧩 Module Scores</div>
    ${moduleRowsPage1}

    <div class="footer">
      <div class="brand"><span class="brand-dot"></span>NeuroTwin AI — Confidential Clinical Report</div>
      <div>Page 1 of 2 • Patient ID: ${data.patientId}</div>
    </div>
  </div>

  <!-- ============ PAGE 2: PERFORMANCE TRENDS ============ -->
  <div class="page">
    <div class="header">
      <div class="header-top">
        <div class="brand-block">
          <div class="brand-logo">N</div>
          <div class="brand-text">
            <h1>Performance Trends</h1>
            <p>Longitudinal Analysis • NeuroTwin AI</p>
          </div>
        </div>
        <div class="report-tag">Page 2</div>
      </div>
      <div class="header-meta">
        <span><strong>Patient:</strong> ${data.patient.name}</span>
        <span><strong>Patient ID:</strong> ${data.patientId}</span>
        <span><strong>Report Date:</strong> ${data.dateGenerated}</span>
      </div>
    </div>

    <div class="section-title">📈 Module Trend Analysis</div>
    ${trendChartsPage2}

    <div class="summary-box">
      <h3>📌 Trend Summary</h3>
      <p>${summaryText}</p>
      <div class="badges">${trendBadges}</div>
    </div>

    <div class="footer">
      <div class="brand"><span class="brand-dot"></span>NeuroTwin AI — Confidential Clinical Report</div>
      <div>Page 2 of 2 • Patient ID: ${data.patientId}</div>
    </div>
  </div>

</body>
</html>
    `;
  };

  // ===== HELPERS =====
  const getStatusColor = (current: number, baseline: number) => {
    if (baseline === 0) return 'text-slate-500';
    const diff = ((current - baseline) / baseline) * 100;
    if (diff >= 0) return 'text-emerald-600 dark:text-emerald-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBg = (current: number, baseline: number) => {
    if (baseline === 0) return 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600';
    const diff = ((current - baseline) / baseline) * 100;
    if (diff >= 0) return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getStatusIcon = (current: number, baseline: number) => {
    if (baseline === 0) return <FiMinus className="w-5 h-5 text-slate-400" />;
    const diff = ((current - baseline) / baseline) * 100;
    if (diff >= 3) return <FiTrendingUp className="w-5 h-5 text-emerald-500" />;
    if (diff >= -3) return <FiMinus className="w-5 h-5 text-amber-500" />;
    return <FiTrendingDown className="w-5 h-5 text-red-500" />;
  };

  const getProgressWidth = (value: number, range: [number, number]) => {
    const min = range[0];
    const max = range[1];
    if (max === min) return 50;
    const percentage = ((value - min) / (max - min)) * 100;
    return Math.min(Math.max(percentage, 0), 100);
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
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Generating your report...</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Analyzing assessment data</p>
        </div>
      </div>
    );
  }

  // ==================== NO DATA STATE ====================
  if (!hasAssessments || !reportData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[70vh]"
      >
        <div className="text-center max-w-md">
          <div className="relative inline-block">
            <div className="text-8xl mb-4 animate-float">📊</div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            No Report Available
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            Complete your first assessment to generate a comprehensive Digital Twin report.
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
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <><FiLoader className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><FiRefreshCw className="w-4 h-4" /> Retry</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4 print:bg-white">
      {/* ===== REPORT HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 print:bg-indigo-700 print:shadow-none"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse print:hidden" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse print:hidden" />

        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <FiFileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Clinical Digital Twin Report</h1>
                <div className="text-indigo-100 text-sm flex flex-wrap items-center gap-3 mt-1">
                  <span>Patient: {reportData.patientName}</span>
                  <span className="w-1 h-1 bg-indigo-300 rounded-full" />
                  <span>ID: {reportData.patientId}</span>
                  <span className="w-1 h-1 bg-indigo-300 rounded-full" />
                  <span>Generated: {reportData.dateGenerated}</span>
                  <span className="w-1 h-1 bg-indigo-300 rounded-full" />
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live Data
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? (
                <><FiLoader className="w-4 h-4 animate-spin" /> Preparing...</>
              ) : (
                <><FiDownload className="w-4 h-4" /> Download Report</>
              )}
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ===== PAGE NAVIGATION ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 print:hidden"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className={`px-3 py-1 rounded-lg ${currentPage === 1 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
              Page 1: Assessment Summary
            </span>
            <span className="text-slate-300">|</span>
            <span className={`px-3 py-1 rounded-lg ${currentPage === 2 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
              Page 2: Trends
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {currentPage} / 2
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
            disabled={currentPage === 2}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* ===== PAGE 1: ASSESSMENT SUMMARY ===== */}
      <AnimatePresence mode="wait">
        {currentPage === 1 && (
          <motion.div
            key="page1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-8 border-indigo-200 dark:border-indigo-800/30 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {reportData.overallScore}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Overall Score</p>
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        reportData.overallStatus === 'Improving' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        reportData.overallStatus === 'Stable' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        reportData.overallStatus === 'Declining' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {reportData.overallStatus}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Assessment Summary</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Latest assessment from each module
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <p className="text-xs text-slate-400">Baseline</p>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{reportData.baselineScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Change</p>
                        <p className={`text-lg font-bold ${
                          reportData.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {reportData.changePercent >= 0 ? '+' : ''}{reportData.changePercent}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Points</p>
                        <p className={`text-lg font-bold ${
                          reportData.changePoints >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {reportData.changePoints >= 0 ? '+' : ''}{reportData.changePoints}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-48 h-48">
                  <Doughnut
                    data={{
                      labels: ['Within Range', 'Above Range', 'Below Range'],
                      datasets: [{
                        data: [75, 18, 7],
                        backgroundColor: ['#6366f1', '#10b981', '#ef4444'],
                        borderWidth: 0,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            usePointStyle: true,
                            padding: 8,
                            font: { size: 10 },
                            color: '#64748b'
                          }
                        }
                      },
                      cutout: '70%'
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* ===== All Module Scores + SHAP ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <FiBarChart2 className="text-indigo-600" />
                Module Scores & Explanations
              </h3>
              <div className="grid gap-4">
                {reportData.modules.map((module, index) => {
                  const config = MODULE_CONFIGS.find(c => c.name === module.name);
                  const Icon = config?.icon || FiActivity;
                  const color = config?.color || '#6366f1';

                  return (
                    <motion.div
                      key={module.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 + 0.35 }}
                      className={`p-4 rounded-xl border ${module.hasData ? getStatusBg(module.current, module.baseline) : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600'}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: color + '20', color: color }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <h4 className="font-semibold text-slate-800 dark:text-white capitalize">
                              {module.name}
                            </h4>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {module.unit}
                            </span>
                            {module.hasData && (
                              <div className="flex items-center gap-1">
                                {getStatusIcon(module.current, module.baseline)}
                                <span className={`text-xs font-medium ${getStatusColor(module.current, module.baseline)}`}>
                                  {module.baseline > 0
                                    ? `${((module.current - module.baseline) / module.baseline * 100).toFixed(1)}%`
                                    : '0%'}
                                </span>
                              </div>
                            )}
                            {!module.hasData && (
                              <span className="text-xs text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                No data
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {module.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            {module.hasData ? (
                              <>
                                <span>Current: <strong className="text-slate-700 dark:text-slate-300">{module.current} {module.unit}</strong></span>
                                <span>Baseline: {module.baseline} {module.unit}</span>
                                <span>Data Points: {module.trend.length}</span>
                              </>
                            ) : (
                              <span className="text-slate-400">No data available for this module</span>
                            )}
                          </div>
                        </div>
                        {module.hasData && (
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className={`text-xl font-bold ${getStatusColor(module.current, module.baseline)}`}>
                                {module.current}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">Score</p>
                            </div>
                            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${getProgressWidth(module.current, module.range)}%`,
                                  backgroundColor: color
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {module.hasData && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            <span className="font-medium">Interpretation:</span> {module.interpretation}
                          </p>
                        </div>
                      )}

                      {module.hasData && user && (
                        <SHAPExplanation
                          userId={user.id}
                          module={module.key as 'voice' | 'tremor' | 'typing' | 'memory' | 'face'}
                          moduleColor={color}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== PAGE 2: DYNAMIC TRENDS ===== */}
      <AnimatePresence mode="wait">
        {currentPage === 2 && (
          <motion.div
            key="page2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                  <FiCalendar className="text-indigo-600" />
                  Performance Trends
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-indigo-500" />
                    Current
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed" />
                    Baseline
                  </span>
                </div>
              </div>

              {reportData.modules.every(m => m.trend.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Trend Data Available</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Complete at least 2 assessments to see your performance trends.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reportData.modules.map((module, index) => {
                  const config = MODULE_CONFIGS.find(c => c.name === module.name);
                  const color = config?.color || '#6366f1';
                  const hasData = module.trend.length > 0;

                  return (
                    <motion.div
                      key={module.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 + 0.25 }}
                      className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-800 dark:text-white capitalize">
                          {module.name}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {module.unit} • {module.trend.length} data points
                        </span>
                      </div>
                      {hasData ? (
                        <>
                          <div className="h-[180px]">
                            <Line
                              data={{
                                labels: module.trendLabels,
                                datasets: [
                                  {
                                    label: 'Score',
                                    data: module.trend,
                                    borderColor: color,
                                    backgroundColor: color + '20',
                                    fill: true,
                                    tension: 0.4,
                                    pointBackgroundColor: color,
                                    pointBorderColor: '#fff',
                                    pointBorderWidth: 2,
                                    pointRadius: 4,
                                  },
                                  {
                                    label: 'Baseline',
                                    data: Array(module.trend.length).fill(module.baseline),
                                    borderColor: '#94a3b8',
                                    borderDash: [5, 5],
                                    fill: false,
                                    pointRadius: 0,
                                  }
                                ]
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                  y: {
                                    min: 0,
                                    max: 100,
                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                    ticks: { color: '#94a3b8', font: { size: 9 } },
                                  },
                                  x: {
                                    grid: { display: false },
                                    ticks: { color: '#94a3b8', font: { size: 9 } },
                                  }
                                },
                                interaction: { intersect: false, mode: 'index' },
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>Min: {Math.min(...module.trend).toFixed(2)}</span>
                            <span>Max: {Math.max(...module.trend).toFixed(2)}</span>
                            <span>Avg: {(module.trend.reduce((a, b) => a + b, 0) / module.trend.length).toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="h-[180px] flex items-center justify-center flex-col">
                          <p className="text-sm text-slate-400">No data available</p>
                          <p className="text-xs text-slate-400 mt-1">Complete assessments to see trends</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {reportData.modules.some(m => m.trend.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FiCompass className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Trend Summary</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {reportData.changePercent >= 3 ? (
                        <>Overall brain health shows <span className="font-bold text-emerald-600">positive improvement</span> of {reportData.changePercent}% from baseline.</>
                      ) : reportData.changePercent <= -3 ? (
                        <>Overall brain health shows a <span className="font-bold text-red-600">decline</span> of {Math.abs(reportData.changePercent)}% from baseline.</>
                      ) : (
                        <>Overall brain health remains <span className="font-bold text-amber-600">stable</span> compared to baseline.</>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {reportData.modules.filter(m => m.hasData).map((m) => {
                        const diff = m.baseline > 0 ? ((m.current - m.baseline) / m.baseline) * 100 : 0;
                        const isPositive = diff >= 0;
                        return (
                          <span key={m.name} className={`text-xs px-2 py-1 rounded-lg ${
                            isPositive
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {isPositive ? '↑' : '↓'} {m.name}: {isPositive ? '+' : ''}{diff.toFixed(1)}%
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REPORT FOOTER ===== */}
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
          </div>
          <span>•</span>
          <span>Clinical Report</span>
          <span>•</span>
          <span>Version 2.4.1</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Patient ID: {reportData.patientId}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live Data
          </span>
          <span>•</span>
          <span>Generated: {reportData.dateGenerated}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default DigitalTwinReport;