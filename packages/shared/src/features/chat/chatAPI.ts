import { AxiosInstance } from 'axios';
import { ChatTokenResponse } from './types';

const API_ENDPOINT_CHAT_TOKEN = '/chat/token'; // Relative path for the chat token

/**
 * Fetch the GetStream chat token for the authenticated user.
 * The Axios instance is expected to handle the baseURL override and
 * adding the necessary X-User-Name header via interceptors.
 * @param apiClient The configured Axios instance.
 * @returns Promise with chat token data (apiKey, token, userId).
 */
export const fetchChatToken = async (apiClient: AxiosInstance): Promise<ChatTokenResponse> => {
    try {
        // Make a POST request to the relative path.
        // The interceptor will handle setting the correct baseURL and headers.
        const response = await apiClient.post<ChatTokenResponse>(API_ENDPOINT_CHAT_TOKEN);
        console.log("Chat token fetched successfully:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching chat token:", error.response?.data || error.message);
        // Re-throw a more specific error message if available from the API response
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch chat token: ${error.response.data.message}`);
        }
        // Fallback error message
        throw new Error('Failed to fetch chat token');
    }
};
