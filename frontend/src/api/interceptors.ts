import axios from 'axios';

// API endpoints for interceptors
export const getInterceptors = async () => {
    try {
        const response = await axios.get('/api/v1/interceptors');
        return response.data;
    } catch (error) {
        console.error('Error fetching interceptors:', error);
        throw error;
    }
};
