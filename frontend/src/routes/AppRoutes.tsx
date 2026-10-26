// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from '@/layouts/MainLayout'

// Auth Pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import VerifyEmail from '@/pages/auth/VerifyEmail'

// Patient Pages
import PatientDashboard from '@/pages/patient/Dashboard'
import PatientAssessment from '@/pages/patient/Assessment'
import DigitalBrainTwin from '@/pages/patient/DigitalBrainTwin'
import PatientTimeline from '@/pages/patient/Timeline'
import PatientReports from '@/pages/patient/Reports'
import PatientChat from '@/pages/patient/ChatAssistant'
import PatientProfile from '@/pages/patient/Profile'
import PatientNotifications from '@/pages/patient/Notifications'
import PatientSettings from '@/pages/patient/Settings'

// Doctor Pages
import DoctorDashboard from '@/pages/doctor/Dashboard'
import PatientList from '@/pages/doctor/PatientList'
import PatientDetails from '@/pages/doctor/PatientDetails'
import DoctorAnalytics from '@/pages/doctor/Analytics'
import DoctorReports from '@/pages/doctor/Reports'
import DoctorProfile from '@/pages/doctor/Profile'
// REMOVE DoctorSettings if not needed

// Family Pages
import FamilyDashboard from '@/pages/family/Dashboard'
import FamilyPatientProgress from '@/pages/family/PatientProgress'
import FamilyAlerts from '@/pages/family/Alerts'

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers from '@/pages/admin/Users'
import AdminDoctors from '@/pages/admin/Doctors'
import AdminSettings from '@/pages/admin/AISettings'

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        {/* Patient Routes */}
        <Route path="/patient/dashboard" element={<ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/assessment" element={<ProtectedRoute role="patient"><PatientAssessment /></ProtectedRoute>} />
        <Route path="/patient/digital-twin" element={<ProtectedRoute role="patient"><DigitalBrainTwin /></ProtectedRoute>} />
        <Route path="/patient/timeline" element={<ProtectedRoute role="patient"><PatientTimeline /></ProtectedRoute>} />
        <Route path="/patient/reports" element={<ProtectedRoute role="patient"><PatientReports /></ProtectedRoute>} />
        <Route path="/patient/chat" element={<ProtectedRoute role="patient"><PatientChat /></ProtectedRoute>} />
        <Route path="/patient/profile" element={<ProtectedRoute role="patient"><PatientProfile /></ProtectedRoute>} />
        <Route path="/patient/notifications" element={<ProtectedRoute role="patient"><PatientNotifications /></ProtectedRoute>} />
        <Route path="/patient/settings" element={<ProtectedRoute role="patient"><PatientSettings /></ProtectedRoute>} />

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/patients" element={<ProtectedRoute role="doctor"><PatientList /></ProtectedRoute>} />
        <Route path="/doctor/analytics" element={<ProtectedRoute role="doctor"><DoctorAnalytics /></ProtectedRoute>} />
        <Route path="/doctor/reports" element={<ProtectedRoute role="doctor"><DoctorReports /></ProtectedRoute>} />
        <Route path="/doctor/patient/:id" element={<ProtectedRoute role="doctor"><PatientDetails /></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute role="doctor"><DoctorProfile /></ProtectedRoute>} />
        {/* REMOVE /doctor/settings route if not needed */}

        {/* Family Routes */}
        <Route path="/family/dashboard" element={<ProtectedRoute role="family"><FamilyDashboard /></ProtectedRoute>} />
        <Route path="/family/progress" element={<ProtectedRoute role="family"><FamilyPatientProgress /></ProtectedRoute>} />
        <Route path="/family/alerts" element={<ProtectedRoute role="family"><FamilyAlerts /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/doctors" element={<ProtectedRoute role="admin"><AdminDoctors /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default AppRoutes