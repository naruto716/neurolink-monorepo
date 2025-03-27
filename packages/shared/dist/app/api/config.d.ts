/**
 * API Configuration
 *
 * Central place to manage API settings
 */
export declare const API_CONFIG: {
    baseUrl: string;
    apiVersion: string;
    endpoints: {
        health: string;
        posts: string;
    };
    defaultHeaders: {
        'Content-Type': string;
        Accept: string;
    };
};
