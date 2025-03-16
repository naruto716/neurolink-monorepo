import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import tokensReducer from "../../features/tokens/tokensSlice";
export const store = configureStore({
    reducer: {
        tokens: tokensReducer,
        // Add other reducers here as needed
    }
});
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
