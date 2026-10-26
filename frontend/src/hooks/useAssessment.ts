// src/hooks/useAssessment.ts
import { useState, useCallback } from 'react'
import api from '@/services/api'
import type { Assessment, AssessmentResult } from '@/types/assessment'
import toast from 'react-hot-toast'

export const useAssessment = () => {
  const [loading, setLoading] = useState(false)
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [results, setResults] = useState<AssessmentResult | null>(null)

  const startAssessment = useCallback(async (userId: number) => {
    setLoading(true)
    try {
      const response = await api.post('/assessment/start', { userId })
      setCurrentAssessment(response.data)
      toast.success('Assessment started!')
      return response.data
    } catch (error) {
      toast.error('Failed to start assessment')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const submitAssessment = useCallback(async (data: any) => {
    setLoading(true)
    try {
      const response = await api.post('/assessment/submit', data)
      setResults(response.data)
      toast.success('Assessment submitted successfully!')
      return response.data
    } catch (error) {
      toast.error('Failed to submit assessment')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getAssessmentHistory = useCallback(async (userId: number) => {
    setLoading(true)
    try {
      const response = await api.get(`/assessment/history/${userId}`)
      setAssessments(response.data)
      return response.data
    } catch (error) {
      toast.error('Failed to load assessment history')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    currentAssessment,
    assessments,
    results,
    startAssessment,
    submitAssessment,
    getAssessmentHistory,
  }
}