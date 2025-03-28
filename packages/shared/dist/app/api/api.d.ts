import { AxiosInstance } from 'axios';
import { SharedRootState } from '../store/store';
type GetStateFn = () => SharedRootState;
/**
 * Creates and configures an Axios instance with interceptors.
 * @param getState - A function that returns the current Redux state (or the relevant part).
 * @returns Configured Axios instance.
 */
export declare const createApiClient: (getState: GetStateFn) => AxiosInstance;
export {};
