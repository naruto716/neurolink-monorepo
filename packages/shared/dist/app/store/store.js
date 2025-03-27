import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import tokensReducer from "../../features/tokens/tokensSlice";
import userReducer from "../../features/user/userSlice";
// Reducer imports are commented out to avoid circular dependencies
// Theme and accessibility reducers will be added dynamically
// Initial reducers
const initialReducers = {
    tokens: tokensReducer,
    user: userReducer,
};
// Create the root reducer
let rootReducer = combineReducers(initialReducers);
// Configure the store
export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: {
            // Ignore these action types for serializable check
            ignoredActions: ['user/fetchUser/rejected'],
        },
    }),
    devTools: true
});
// Method to add reducers dynamically
export const injectReducer = (key, reducer) => {
    const currentReducers = store.getState();
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
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
