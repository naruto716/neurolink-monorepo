import { TokensState } from '../../features/tokens/tokensSlice';
import { UserState } from '../../features/user/types';
import { PaginatedUsersState } from '../../features/user/paginatedUsersSlice';
export interface SharedRootState {
    tokens: TokensState;
    user: UserState;
    paginatedUsers: PaginatedUsersState;
}
export declare const sharedReducers: {
    tokens: import("redux").Reducer<TokensState>;
    user: import("redux").Reducer<UserState>;
    paginatedUsers: import("redux").Reducer<PaginatedUsersState>;
};
export type SharedStateSelector<T> = (state: any) => T;
declare const exampleStore: import("@reduxjs/toolkit").EnhancedStore<{
    tokens: TokensState;
    user: UserState;
    paginatedUsers: PaginatedUsersState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        tokens: TokensState;
        user: UserState;
        paginatedUsers: PaginatedUsersState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type SharedDispatch = typeof exampleStore.dispatch;
export {};
