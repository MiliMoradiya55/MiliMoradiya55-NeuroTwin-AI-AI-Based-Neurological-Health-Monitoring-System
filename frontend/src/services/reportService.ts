// src/services/reportService.ts
import api from './api'

export const reportService = {
  getReports: () => api.get('/reports'),
  downloadPDF: (id: number) => api.get(`/reports/${id}/pdf`, { responseType: 'blob' }),
}

export default reportService
