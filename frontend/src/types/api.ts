// src/types/api.ts
export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface ApiError {
  detail: string
  status_code: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    name: string
    email: string
    role: 'patient' | 'doctor' | 'family' | 'admin'
  }
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  age: number
  gender: 'male' | 'female' | 'other'
  role: 'patient' | 'doctor' | 'family'
}
