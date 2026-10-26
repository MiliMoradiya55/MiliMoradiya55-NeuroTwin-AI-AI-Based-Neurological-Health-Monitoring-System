import axios from 'axios';

// API endpoints for reports
export const getReports = async () => {
    try {
        const response = await axios.get('/api/v1/reports');
        return response.data;
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
    }
};
