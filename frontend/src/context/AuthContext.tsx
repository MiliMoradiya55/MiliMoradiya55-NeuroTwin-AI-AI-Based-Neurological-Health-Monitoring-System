// frontend/src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'family' | 'admin';
  avatar?: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // ===== FETCH USER FROM BACKEND =====
  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Always get the user from /auth/me. This is the single source of truth.
      const userData = await authAPI.getMe();
      setUser(userData);
      // Cache the full user object in localStorage for faster subsequent loads
      localStorage.setItem('user', JSON.stringify(userData));
      setAuthError(null);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 404) {
        toast.error('User not found. Please login again.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to fetch user data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ===== LOGIN =====
  const login = async (email: string, password: string) => {
    try {
      setAuthError(null);

      if (!email || !password) {
        const errorMsg = 'Please enter both email and password';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = await authAPI.login(email, password);

      if (!data.access_token) {
        const errorMsg = 'Invalid response from server';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setAuthError(null);

      toast.success('Welcome back! 🎉');
      return { success: true };

    } catch (error: any) {
      console.error('Login error:', error);

      let errorMsg = 'Login failed. Please try again.';

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 401) {
          errorMsg = detail || 'Invalid email or password. Please try again.';
        } else if (status === 422) {
          errorMsg = 'Please check your input format.';
        } else if (status === 500) {
          errorMsg = 'Server error. Please try again later.';
        } else {
          errorMsg = detail || 'Login failed. Please try again.';
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to server. Please check if backend is running on port 8000.';
      } else if (error.request) {
        errorMsg = 'No response from server. Please check your network connection.';
      }

      setAuthError(errorMsg);
      toast.error(errorMsg);

      return { success: false, error: errorMsg };
    }
  };

  // ===== REGISTER =====
  const register = async (userData: any) => {
    try {
      setAuthError(null);

      if (!userData.name || !userData.email || !userData.password) {
        const errorMsg = 'Please fill all required fields';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (userData.password.length < 6) {
        const errorMsg = 'Password must be at least 6 characters';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      const registerData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'patient',
        age: userData.age ? parseInt(userData.age) : null,
        gender: userData.gender || null,
        phone: userData.phone || null,
        address: userData.address || null,
      };

      console.log('📝 Register data:', registerData);

      const data = await authAPI.register(registerData);

      if (!data.access_token) {
        const errorMsg = 'Invalid response from server';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setAuthError(null);

      toast.success('Account created successfully! 🎉');
      return { success: true };

    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMsg = 'Registration failed. Please try again.';

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 400) {
          errorMsg = detail || 'Email already registered or invalid data.';
        } else if (status === 422) {
          errorMsg = 'Please check your input format.';
        } else if (status === 500) {
          errorMsg = 'Server error. Please try again later.';
        } else {
          errorMsg = detail || 'Registration failed. Please try again.';
        }
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to server. Please check if backend is running on port 8000.';
      } else if (error.request) {
        errorMsg = 'No response from server. Please check your network connection.';
      }

      setAuthError(errorMsg);
      toast.error(errorMsg);

      return { success: false, error: errorMsg };
    }
  };

  // ===== LOGOUT =====
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAuthError(null);
    toast.success('Logged out successfully 👋');
  };

  // ===== CLEAR ERROR =====
  const clearError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};