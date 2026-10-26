// src/services/assessmentService.ts
import api from './api'
import type { Assessment, AssessmentResult } from '@/types/assessment'

export const assessmentService = {
  async startAssessment(userId: number): Promise<Assessment> {
    const response = await api.post('/assessment/start', { userId })
    return response.data
  },

  async submitAssessment(data: any): Promise<AssessmentResult> {
    const response = await api.post('/assessment/submit', data)
    return response.data
  },

  async getHistory(userId: number): Promise<Assessment[]> {
    const response = await api.get(`/assessment/history/${userId}`)
    return response.data
  },

  async getResult(assessmentId: number): Promise<AssessmentResult> {
    const response = await api.get(`/assessment/result/${assessmentId}`)
    return response.data
  },

  async getBrainHealthScore(userId: number): Promise<{ score: number; change: number }> {
    const response = await api.get(`/assessment/score/${userId}`)
    return response.data
  },
}