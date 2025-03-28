import { combineReducers } from "@reduxjs/toolkit";
import tokensReducer, { TokensState } from "../../features/tokens/tokensSlice";
import userReducer from "../../features/user/userSlice";
import { UserState } from "../../features/user/types";
// Reducer imports are commented out to avoid circular dependencies
// Theme and accessibility reducers will be added dynamically

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
export const sharedReducers = {
  tokens: tokensReducer,
  user: userReducer,
};

/**
 * Export a combined root reducer for the shared state slices.
 * This can be used directly by apps if they don't need to combine it with other reducers at the same level.
 */
export const sharedRootReducer = combineReducers(sharedReducers);

/**
 * Generic type for a selector function operating on the SharedRootState.
 */
export type SharedStateSelector<T> = (state: SharedRootState) => T;

// Removed configureStore, injectReducer, AppDispatch, RootState (specific to an instance), useAppDispatch, useAppSelector