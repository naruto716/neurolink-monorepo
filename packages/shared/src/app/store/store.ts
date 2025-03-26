import { configureStore, combineReducers, Reducer } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import tokensReducer from "../../features/tokens/tokensSlice";
// Reducer imports are commented out to avoid circular dependencies
// Theme and accessibility reducers will be added dynamically

// Initial reducers
const initialReducers = {
  tokens: tokensReducer,
};

// Create the root reducer
let rootReducer = combineReducers(initialReducers);

export const store = configureStore({
  reducer: rootReducer,
  devTools: true
});

// Method to add reducers dynamically
export const injectReducer = (key: string, reducer: Reducer) => {
  const currentReducers = store.getState() as Record<string, unknown>;
  
  if (!(key in currentReducers)) {
    // Add new reducer and recreate the root reducer
    rootReducer = combineReducers({
      ...initialReducers,
      [key]: reducer,
    });
    
    // Replace the existing reducer with our new one
    store.replaceReducer(rootReducer);
  }
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;