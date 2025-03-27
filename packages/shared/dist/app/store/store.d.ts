import { Reducer } from "@reduxjs/toolkit";
import { TypedUseSelectorHook } from "react-redux";
export declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    tokens: import("../../features/tokens/tokensSlice").TokensState;
    user: import("../..").UserState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        tokens: import("../../features/tokens/tokensSlice").TokensState;
        user: import("../..").UserState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export declare const injectReducer: (key: string, reducer: Reducer) => void;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export declare const useAppDispatch: () => import("redux-thunk").ThunkDispatch<{
    tokens: import("../../features/tokens/tokensSlice").TokensState;
    user: import("../..").UserState;
}, undefined, import("redux").UnknownAction> & import("redux").Dispatch<import("redux").UnknownAction>;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;
