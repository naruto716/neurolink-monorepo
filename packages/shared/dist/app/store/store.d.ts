import { TokensState } from "../../features/tokens/tokensSlice";
import { UserState } from "../../features/user/types";
/**
 * Define the root state shape for the shared reducers.
 * This interface describes the part of the state managed by the shared package.
 */
export interface SharedRootState {
    tokens: TokensState;
    user: UserState;
}
/**
 * Export the individual shared reducers.
 * Apps can import these and combine them with their own reducers.
 */
export declare const sharedReducers: {
    tokens: import("redux").Reducer<TokensState>;
    user: import("redux").Reducer<UserState>;
};
/**
 * Export a combined root reducer for the shared state slices.
 * This can be used directly by apps if they don't need to combine it with other reducers at the same level.
 */
export declare const sharedRootReducer: import("redux").Reducer<{
    tokens: TokensState;
    user: UserState;
}, import("redux").UnknownAction, Partial<{
    tokens: TokensState | undefined;
    user: UserState | undefined;
}>>;
/**
 * Generic type for a selector function operating on the SharedRootState.
 */
export type SharedStateSelector<T> = (state: SharedRootState) => T;
