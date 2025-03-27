export interface HealthResponse {
    status: string;
    message?: string;
    version?: string;
}
/**
 * Get API health status
 * @returns Promise with health check response
 */
export declare const checkHealth: () => Promise<HealthResponse>;
