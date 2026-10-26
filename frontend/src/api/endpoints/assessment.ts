// src/api/endpoints/assessment.ts
import apiClient from '../client';

export interface VoiceTestRequest {
  user_id: number;
  audio: File;
}

export interface MemoryTestRequest {
  user_id: number;
  memory_type: 'word_recall' | 'object_recall' | 'number_recall' | 'sequence_memory';
  score: number;
  accuracy: number;
  correct_count: number;
  total_count: number;
  avg_reaction_time: number;
}

export interface AssessmentResponse {
  status: string;
  assessment_id: number;
  score: number;
  details: any;
}

export const assessmentApi = {
  submitVoice: (data: FormData) =>
    apiClient.post<AssessmentResponse>('/assessment/voice', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  submitMemory: (data: MemoryTestRequest) =>
    apiClient.post<AssessmentResponse>('/assessment/memory', data),

  getHistory: (userId: number) =>
    apiClient.get(`/assessment/history/${userId}`),

  getBrainHealthScore: (userId: number) =>
    apiClient.get(`/assessment/health-score/${userId}`),
};