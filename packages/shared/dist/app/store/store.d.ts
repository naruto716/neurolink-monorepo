import { TokensState } from '../../features/tokens/tokensSlice';
import { UserState } from '../../features/user/types';
import { PaginatedUsersState } from '../../features/user/paginatedUsersSlice';
import { FeedPostsState } from '../../features/posts/feedPostsSlice';
export interface SharedRootState {
    tokens: TokensState;
    user: UserState;
    paginatedUsers: PaginatedUsersState;
    feedPosts: FeedPostsState;
}
export declare const sharedReducers: {
    tokens: import("redux").Reducer<TokensState>;
    user: import("redux").Reducer<UserState>;
    paginatedUsers: import("redux").Reducer<PaginatedUsersState>;
    feedPosts: import("redux").Reducer<FeedPostsState>;
};
export type SharedStateSelector<T> = (state: any) => T;
declare const exampleStore: import("@reduxjs/toolkit").EnhancedStore<{
    tokens: TokensState;
    user: UserState;
    paginatedUsers: PaginatedUsersState;
    feedPosts: FeedPostsState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        tokens: TokensState;
        user: UserState;
        paginatedUsers: PaginatedUsersState;
        feedPosts: FeedPostsState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type SharedDispatch = typeof exampleStore.dispatch;
export {};
