import axios from 'axios';

// API endpoints for chat
export const getChat = async () => {
    try {
        const response = await axios.get('/api/v1/chat');
        return response.data;
    } catch (error) {
        console.error('Error fetching chat:', error);
        throw error;
    }
};
