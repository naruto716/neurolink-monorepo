import { AsyncThunk } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
import { ForumPostDTO, PaginatedForumPostsResponseDTO, FetchForumPostsParams } from './types';
import { SharedRootState } from '../../app/store/store';
export interface ForumState {
    posts: ForumPostDTO[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalPosts: number;
}
type FetchForumPostsThunkArg = {
    apiClient: AxiosInstance;
    params?: FetchForumPostsParams;
};
export declare const fetchForumPosts: AsyncThunk<PaginatedForumPostsResponseDTO, FetchForumPostsThunkArg, {
    rejectValue: string;
    state?: unknown;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const resetForumState: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"forum/resetForumState">;
declare const _default: import("redux").Reducer<ForumState>;
export default _default;
export declare const selectForumPosts: (state: SharedRootState) => ForumPostDTO[];
export declare const selectForumStatus: (state: SharedRootState) => ForumState["status"];
export declare const selectForumError: (state: SharedRootState) => string | null;
export declare const selectForumCurrentPage: (state: SharedRootState) => number;
export declare const selectForumTotalPages: (state: SharedRootState) => number;
export declare const selectForumTotalPosts: (state: SharedRootState) => number;
