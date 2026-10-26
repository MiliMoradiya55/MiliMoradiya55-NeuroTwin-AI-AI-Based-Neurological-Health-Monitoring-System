// src/types/assessment.ts
export interface Assessment {
  id: number
  userId: number
  type: 'voice' | 'tremor' | 'face' | 'memory' | 'typing' | 'reaction' | 'walking'
  score: number
  status: 'pending' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  metrics: AssessmentMetrics
}

export interface AssessmentMetrics {
  voice?: VoiceMetrics
  tremor?: TremorMetrics
  face?: FaceMetrics
  memory?: MemoryMetrics
  typing?: TypingMetrics
  reaction?: ReactionMetrics
  walking?: WalkingMetrics
}

export interface VoiceMetrics {
  pitch: number
  jitter: number
  shimmer: number
  stability: number
  tremor: number
  score: number
  recordingUrl?: string
}

export interface MemoryMetrics {
  score: number
  accuracy: number
  correctCount: number
  totalCount: number
  avgReactionTime: number
  totalTime: number
  level: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement'
}

export interface TremorMetrics {
  frequency: number
  amplitude: number
  stability: number
  score: number
}

export interface FaceMetrics {
  smileIntensity: number
  blinkRate: number
  symmetry: number
  expressiveness: number
  score: number
}

export interface TypingMetrics {
  wpm: number
  accuracy: number
  rhythm: number
  consistency: number
  score: number
}

export interface ReactionMetrics {
  visualTime: number
  audioTime: number
  averageTime: number
  score: number
}

export interface WalkingMetrics {
  speed: number
  stepLength: number
  balance: number
  symmetry: number
  score: number
}

export interface AssessmentResult {
  id: number
  userId: number
  assessmentId: number
  brainHealthScore: number
  moduleScores: Record<string, number>
  recommendations: string[]
  createdAt: string
}