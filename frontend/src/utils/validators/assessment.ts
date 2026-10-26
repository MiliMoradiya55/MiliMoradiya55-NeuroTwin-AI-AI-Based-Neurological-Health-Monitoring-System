import { z } from 'zod'

export const assessmentValidationSchema = z.object({
  type: z.enum(['voice', 'tremor', 'memory', 'typing', 'reaction', 'face']),
  score: z.number().min(0).max(100),
})
