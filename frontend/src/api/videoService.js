import axios from 'axios';

const API_URL = 'http://localhost:8080/api/videos';

export const fetchVideosAndChannels = async (params) => {
    try {
        const response = await axios.get(API_URL, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching videos and channels:", error);
        throw error;
    }
};