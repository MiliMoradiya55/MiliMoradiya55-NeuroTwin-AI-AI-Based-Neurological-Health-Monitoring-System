// src/services/twinService.ts
import api from './api'

export const twinService = {
  getProfile: () => api.get('/twin/profile'),
  getBaseline: () => api.get('/twin/baseline'),
  getDivergence: () => api.get('/twin/divergence'),
  getXAI: () => api.get('/twin/xai'),
}

export default twinService
