// src/types/auth.ts
export interface User {
  id: number
  name: string
  email: string
  role: 'patient' | 'doctor' | 'family' | 'admin'
  avatar?: string
  age?: number
  gender?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'patient' | 'doctor' | 'family'
  age?: number
  gender?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ResetPasswordRequest {
  email: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}