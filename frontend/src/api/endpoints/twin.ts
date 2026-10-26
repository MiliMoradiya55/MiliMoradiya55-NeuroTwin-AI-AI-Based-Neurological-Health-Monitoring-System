import axios from 'axios';

// API endpoints for twin
export const getTwinProfile = async () => {
    try {
        const response = await axios.get('/api/v1/twin/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching twin profile:', error);
        throw error;
    }
};
