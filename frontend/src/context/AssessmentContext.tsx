import React, { createContext, useState, useContext } from 'react'
import api from '@/services/api'

interface Assessment {
  id: number
  type: string
  score: number
  date: string
  status: 'pending' | 'completed' | 'failed'
}

interface AssessmentContextType {
  assessments: Assessment[]
  currentAssessment: Assessment | null
  loading: boolean
  startAssessment: (type: string) => Promise<void>
  submitAssessment: (data: any) => Promise<void>
  getAssessments: () => Promise<void>
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined)

export const AssessmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(false)

  const startAssessment = async (type: string) => {
    setLoading(true)
    try {
      const response = await api.post('/assessment/start', { type })
      setCurrentAssessment(response.data)
    } catch (error) {
      console.error('Error starting assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitAssessment = async (data: any) => {
    setLoading(true)
    try {
      await api.post('/assessment/submit', data)
      setCurrentAssessment(null)
      await getAssessments()
    } catch (error) {
      console.error('Error submitting assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAssessments = async () => {
    setLoading(true)
    try {
      const response = await api.get('/assessment/history')
      setAssessments(response.data)
    } catch (error) {
      console.error('Error getting assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AssessmentContext.Provider
      value={{
        assessments,
        currentAssessment,
        loading,
        startAssessment,
        submitAssessment,
        getAssessments,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  )
}

export const useAssessment = () => {
  const context = useContext(AssessmentContext)
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider')
  }
  return context
}