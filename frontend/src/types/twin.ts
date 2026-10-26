// src/types/twin.ts
export interface BrainTwinBaseline {
  userId: number
  created: boolean
  weeks: number
  metrics: DomainMetrics
  status: 'calibrating' | 'stable' | 'monitoring' | 'alert'
  lastUpdated: string
  modelConfidence: number
}

export interface DomainMetrics {
  voice: number
  tremor: number
  walking: number
  memory: number
  reaction: number
  typing: number
  facial: number
  reading: number
}

export interface DivergenceReport {
  domain: string
  currentValue: number
  baselineValue: number
  deviation: number
  trend: 'improving' | 'stable' | 'declining'
  significance: 'normal' | 'watch' | 'alert'
}

export interface XAIExplanation {
  domain: string
  contribution: number
  direction: 'positive' | 'negative'
  description: string
  confidence: number
}
