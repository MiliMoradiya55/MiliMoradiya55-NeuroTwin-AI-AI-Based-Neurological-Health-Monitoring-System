import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: 'patient' | 'doctor' | 'family' | 'admin'
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (role && user?.role !== role) {
    return <Navigate to={`/${user?.role}/dashboard`} />
  }

  return <>{children}</>
}

export default ProtectedRoute