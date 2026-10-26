// src/services/reactionService.ts
import api from './api'

export const reactionService = {
  analyze: (times: number[]) => api.post('/assessment/reaction', { times }),
}

export default reactionService
