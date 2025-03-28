import { combineReducers } from "@reduxjs/toolkit";
import tokensReducer from "../../features/tokens/tokensSlice";
import userReducer from "../../features/user/userSlice";
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
// Removed configureStore, injectReducer, AppDispatch, RootState (specific to an instance), useAppDispatch, useAppSelector
