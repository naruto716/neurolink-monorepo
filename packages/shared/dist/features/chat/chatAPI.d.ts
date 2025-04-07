import { AxiosInstance } from 'axios';
import { ChatTokenResponse } from './types';
/**
 * Fetch the GetStream chat token for the authenticated user.
 * The Axios instance is expected to handle the baseURL override and
 * adding the necessary X-User-Name header via interceptors.
 * @param apiClient The configured Axios instance.
 * @returns Promise with chat token data (apiKey, token, userId).
 */
export declare const fetchChatToken: (apiClient: AxiosInstance) => Promise<ChatTokenResponse>;
