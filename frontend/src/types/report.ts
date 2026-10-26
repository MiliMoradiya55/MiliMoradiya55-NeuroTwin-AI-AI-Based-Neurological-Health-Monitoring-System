// src/types/report.ts
export interface ClinicalReport {
  id: number
  patientId: number
  generatedAt: string
  period: string
  brainHealthScore: number
  scoreChange: number
  domainScores: Record<string, number>
  xaiInsights: XAIInsight[]
  recommendations: string[]
  status: 'draft' | 'finalized' | 'shared'
}

export interface XAIInsight {
  domain: string
  contribution: number
  direction: 'positive' | 'negative'
  explanation: string
}

export interface ReportFilter {
  dateRange: 'week' | 'month' | 'quarter' | 'year'
  patientId?: number
  status?: string
}
