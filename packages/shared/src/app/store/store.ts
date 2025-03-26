import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import tokensReducer from "../../features/tokens/tokensSlice";
// Reducer imports are commented out to avoid circular dependencies
// Theme and accessibility reducers will be added dynamically

export const store = configureStore({
  reducer: {
    tokens: tokensReducer,
    // theme and accessibility will be added dynamically when needed
  },
  devTools: true
});

// Method to add reducers dynamically
export const injectReducer = (key: string, reducer: any) => {
  if (!store.getState()[key]) {
    // @ts-ignore - TS doesn't know about replaceReducers
    store.replaceReducer({
      ...store.getState(),
      [key]: reducer,
    });
  }
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;