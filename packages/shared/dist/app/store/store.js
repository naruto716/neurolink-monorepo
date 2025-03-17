import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import tokensReducer from "../../features/tokens/tokensSlice";
export const store = configureStore({
    reducer: {
        tokens: tokensReducer,
    },
    devTools: true
});
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;
