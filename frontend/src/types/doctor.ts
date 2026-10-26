// src/types/doctor.ts
export interface DoctorProfile {
  id: number
  name: string
  email: string
  specialization: string
  licenseNumber: string
  totalPatients: number
}

export interface DoctorPatient {
  id: number
  patientId: number
  patientName: string
  age: number
  brainHealthScore: number
  twinStatus: 'calibrating' | 'stable' | 'monitoring' | 'alert'
  lastAssessment: string
  enrollmentDate: string
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ClinicalNote {
  id: number
  doctorId: number
  patientId: number
  note: string
  category: 'observation' | 'recommendation' | 'followup'
  createdAt: string
}
