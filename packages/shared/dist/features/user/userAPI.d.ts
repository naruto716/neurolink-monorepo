import { AxiosInstance } from 'axios';
import { User, Tag } from './types';
/**
 * Get the current user profile
 * @param apiClient The Axios instance to use.
 * @returns Promise with user data
 */
export declare const fetchCurrentUser: (apiClient: AxiosInstance) => Promise<User>;
/**
 * Create a new user profile during onboarding
 * @param apiClient The Axios instance to use.
 * @param userData The user data to create
 * @returns Promise with the created user data
 */
export declare const createUser: (apiClient: AxiosInstance, userData: Partial<User>) => Promise<User>;
/**
 * Fetch all available tags for user profiles
 * @param apiClient The Axios instance to use.
 * @returns Promise with array of tags
 */
export declare const fetchTags: (apiClient: AxiosInstance) => Promise<Tag[]>;
