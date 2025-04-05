import { PayloadAction } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
import { Post, PaginatedPostsResponse, FetchPostsByUsernamePayload } from './types';
import { SharedRootState } from '../../app/store/store';
export interface FeedPostsState {
    posts: Post[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    currentUsernameFilters: string[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}
interface FetchFeedPostsThunkArgs extends FetchPostsByUsernamePayload {
    apiClient: AxiosInstance;
}
export declare const fetchFeedPostsThunk: import("@reduxjs/toolkit").AsyncThunk<PaginatedPostsResponse, FetchFeedPostsThunkArgs, {
    rejectValue: string;
    state?: unknown;
    extra?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction> | undefined;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const feedPostsSlice: import("@reduxjs/toolkit").Slice<FeedPostsState, {
    clearFeedPosts: (state: import("immer").WritableDraft<FeedPostsState>) => void;
    setFeedUsernames: (state: import("immer").WritableDraft<FeedPostsState>, action: PayloadAction<string[]>) => void;
    requestFeedRefresh: (state: import("immer").WritableDraft<FeedPostsState>) => void;
}, "feedPosts", "feedPosts", import("@reduxjs/toolkit").SliceSelectors<FeedPostsState>>;
export declare const clearFeedPosts: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"feedPosts/clearFeedPosts">, setFeedUsernames: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "feedPosts/setFeedUsernames">, requestFeedRefresh: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"feedPosts/requestFeedRefresh">;
export declare const selectFeedPosts: (state: SharedRootState) => Post[];
export declare const selectFeedPostsStatus: (state: SharedRootState) => FeedPostsState["status"];
export declare const selectFeedPostsError: (state: SharedRootState) => string | null;
export declare const selectFeedPostsCurrentPage: (state: SharedRootState) => number;
export declare const selectFeedPostsTotalPages: (state: SharedRootState) => number;
export declare const selectFeedPostsTotalItems: (state: SharedRootState) => number;
export declare const selectFeedPostsPageSize: (state: SharedRootState) => number;
export declare const selectFeedCurrentUsernameFilters: (state: SharedRootState) => string[];
declare const _default: import("redux").Reducer<FeedPostsState>;
export default _default;
