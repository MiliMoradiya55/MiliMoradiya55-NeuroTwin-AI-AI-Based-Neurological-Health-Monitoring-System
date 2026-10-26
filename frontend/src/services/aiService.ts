// src/services/aiService.ts
import api from './api'

export const aiService = {
  chat: (message: string) => api.post('/ai/chat', { message }),
  getInsights: () => api.get('/ai/insights'),
}

export default aiService
