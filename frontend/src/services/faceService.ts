// frontend/src/services/faceService.ts

import api from './api';
import toast from 'react-hot-toast';

export const faceService = {
  /**
   * Analyze facial expression from image blob
   */
  analyze: async (imageBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, `face_${Date.now()}.jpg`);
      
      const response = await api.post('/face/assess', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      return response.data;
      
    } catch (error: any) {
      console.error('Face analysis error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check if backend is running.');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.detail || 'Invalid image.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to analyze face.');
      }
      
      throw error;
    }
  },
  
  /**
   * Get face assessment history
   */
  getHistory: async (limit: number = 10) => {
    try {
      const response = await api.get(`/face/history?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Get history error:', error);
      toast.error('Failed to load history');
      throw error;
    }
  },
  
  /**
   * Get latest face assessment
   */
  getLatest: async () => {
    try {
      const response = await api.get('/face/latest');
      return response.data;
    } catch (error: any) {
      console.error('Get latest error:', error);
      return { status: 'success', data: null };
    }
  }
};

export default faceService;