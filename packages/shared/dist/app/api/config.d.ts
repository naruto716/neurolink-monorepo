/**
 * API Configuration
 *
 * Central place to manage API settings
 */
export declare const API_CONFIG: {
    baseUrl: string;
    endpoints: {
        posts: string;
        users: string;
        currentUser: string;
        tags: string;
    };
    defaultHeaders: {
        'Content-Type': string;
        Accept: string;
    };
};
