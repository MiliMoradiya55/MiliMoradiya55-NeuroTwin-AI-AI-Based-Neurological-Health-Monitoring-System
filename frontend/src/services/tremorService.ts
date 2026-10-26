// frontend/src/services/tremorService.ts

import api from './api';
import toast from 'react-hot-toast';

export const tremorService = {
  /**
   * Analyze tremor from video blob
   */
  analyze: async (videoBlob: Blob) => {
    try {
      const formData = new FormData();
      const timestamp = Date.now();
      const filename = `tremor_${timestamp}.webm`;
      
      formData.append('video', videoBlob, filename);
      
      const response = await api.post('/tremor/assess', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout
      });
      
      return response.data;
      
    } catch (error: any) {
      console.error('Tremor analysis error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check if backend is running.');
      } else if (error.response?.status === 413) {
        toast.error('Video file too large. Please record a shorter clip.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.detail || 'Invalid video file.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to analyze tremor.');
      }
      
      throw error;
    }
  },
  
  /**
   * Get tremor assessment history
   */
  getHistory: async (limit: number = 10) => {
    try {
      const response = await api.get(`/tremor/history?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Get history error:', error);
      toast.error('Failed to load history');
      throw error;
    }
  },
  
  /**
   * Get latest tremor assessment
   */
  getLatest: async () => {
    try {
      const response = await api.get('/tremor/latest');
      return response.data;
    } catch (error: any) {
      console.error('Get latest error:', error);
      return { status: 'success', data: null };
    }
  }
};

export default tremorService;