// src/services/doctorService.ts
import api from './api'

export const doctorService = {
  getPatients: () => api.get('/doctor/patients'),
  getPatientDetails: (id: number) => api.get(`/doctor/patients/${id}`),
  addNote: (patientId: number, note: string) => api.post(`/doctor/patients/${patientId}/notes`, { note }),
}

export default doctorService
