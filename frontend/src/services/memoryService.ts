// src/services/memoryService.ts

import api from './api'
import toast from 'react-hot-toast'

export interface MemoryResult {
  score: number
  accuracy: number
  correct_count: number
  total_count: number
  avg_reaction_time: number
  total_time: number
  memory_level: string
  memory_quotient: number
  recommendation: string
  assessment_id?: number
}

export const memoryService = {
  /**
   * Save memory assessment to database
   */
  saveAssessment: async (data: MemoryResult) => {
    try {
      const response = await api.post('/memory/assess', data)
      return response.data
    } catch (error: any) {
      console.error('Error saving memory assessment:', error)
      throw error
    }
  },

  /**
   * Get memory history for a user
   */
  getHistory: async (userId: number) => {
    try {
      const response = await api.get(`/memory/history/${userId}`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching memory history:', error)
      throw error
    }
  },

  /**
   * Get latest memory assessment
   */
  getLatest: async (userId: number) => {
    try {
      const response = await api.get(`/memory/latest/${userId}`)
      return response.data
    } catch (error: any) {
      console.error('Error fetching latest memory assessment:', error)
      throw error
    }
  },

  /**
   * Get memory trend over weeks
   */
  getTrend: async (userId: number, weeks: number = 12) => {
    try {
      const response = await api.get(`/memory/trend/${userId}`, {
        params: { weeks }
      })
      return response.data
    } catch (error: any) {
      console.error('Error fetching memory trend:', error)
      throw error
    }
  }
}