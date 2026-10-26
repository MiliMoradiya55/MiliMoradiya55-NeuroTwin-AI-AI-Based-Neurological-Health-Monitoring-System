// frontend/src/services/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

// ===== CORRECT URL WITH /v1 =====
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network errors
    if (error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please ensure backend is running on port 8000.');
      return Promise.reject(error);
    }
    
    // 401 Unauthorized
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // Log error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    
    return Promise.reject(error);
  }
);

// ===== AUTH API =====
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('GetMe API error:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    }
  },
  verifyToken: async () => {
    try {
      const response = await api.post('/auth/verify-token');
      return response.data;
    } catch (error) {
      console.error('Verify token error:', error);
      throw error;
    }
  }
};
// Add to frontend/src/services/api.ts (at the bottom, near authAPI)

export const feedbackAPI = {
  getStatus: async (userId: number) => {
    const response = await api.get(`/feedback/status/${userId}`);
    return response.data;
  },
  getContext: async (userId: number) => {
    const response = await api.get(`/feedback/context/${userId}`);
    return response.data;
  },
  submit: async (userId: number, payload: any) => {
    const response = await api.post(`/feedback/submit/${userId}`, payload);
    return response.data;
  },
};

// frontend/src/services/api.ts — ADD at the bottom

// ===== AI CHAT API =====
export const chatAPI = {
  /**
   * Send a message to the AI assistant
   * Includes user's brain health context automatically
   */
  sendMessage: async (message: string, language: string = 'en') => {
    try {
      const response = await api.post('/chat/message', {
        message,
        language,
      });
      return response.data; // { text, suggestions, source }
    } catch (error: any) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  /**
   * Clear the AI's conversation memory
   */
  clearHistory: async () => {
    try {
      const response = await api.post('/chat/clear-history');
      return response.data;
    } catch (error: any) {
      console.error('Clear history error:', error);
      throw error;
    }
  },

  /**
   * Health check
   */
  health: async () => {
    try {
      const response = await api.get('/chat/health');
      return response.data;
    } catch (error: any) {
      console.error('Chat health error:', error);
      throw error;
    }
  },
};

export const shapAPI = {
  explain: async (userId: number, module: string) => {
    const response = await api.get(`/timeline/shap-explain/${userId}/${module}`);
    return response.data;
  },
};
export default api;