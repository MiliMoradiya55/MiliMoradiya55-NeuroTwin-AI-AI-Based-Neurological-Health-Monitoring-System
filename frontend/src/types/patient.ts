// src/types/patient.ts
export interface PatientProfile {
  id: number
  name: string
  email: string
  age: number
  gender: 'male' | 'female' | 'other'
  enrollmentDate: string
  baselineWeeks: number
  baselineComplete: boolean
  brainHealthScore: number
  twinStatus: 'calibrating' | 'stable' | 'monitoring' | 'alert'
}

export interface AssessmentResult {
  id: number
  userId: number
  type: 'voice' | 'tremor' | 'memory' | 'typing' | 'reaction' | 'face'
  score: number
  metrics: Record<string, number>
  timestamp: string
  week: number
}

export interface WeeklyAssessment {
  id: number
  week: number
  date: string
  modules: {
    voice: number
    tremor: number
    memory: number
    typing: number
    reaction: number
    face: number
  }
  overallScore: number
  status: 'completed' | 'partial' | 'missed'
}
