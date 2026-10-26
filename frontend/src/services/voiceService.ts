// frontend/src/services/voiceService.ts

import api from './api';
import toast from 'react-hot-toast';

export const voiceService = {
  /**
   * Analyze voice from audio blob
   */
  analyze: async (audioBlob: Blob) => {
    try {
      // Create form data
      const formData = new FormData();
      
      // Generate filename with timestamp
      const timestamp = Date.now();
      const filename = `voice_${timestamp}.wav`;
      
      // Append audio file
      formData.append('audio', audioBlob, filename);
      
      // Make API call
      const response = await api.post('/voice/assess', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout for processing
      });
      
      return response.data;
      
    } catch (error: any) {
      console.error('Voice analysis error:', error);
      
      // Handle specific errors
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check if backend is running.');
      } else if (error.response?.status === 413) {
        toast.error('Audio file too large. Please record a shorter clip.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.detail || 'Invalid audio file.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to analyze voice.');
      }
      
      throw error;
    }
  },
  
  /**
   * Get voice assessment history
   */
  getHistory: async (limit: number = 10) => {
    try {
      const response = await api.get(`/voice/history?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Get history error:', error);
      toast.error('Failed to load history');
      throw error;
    }
  },
  
  /**
   * Get latest voice assessment
   */
  getLatest: async () => {
    try {
      const response = await api.get('/voice/latest');
      return response.data;
    } catch (error: any) {
      console.error('Get latest error:', error);
      return { status: 'success', data: null };
    }
  }
};

export default voiceService;