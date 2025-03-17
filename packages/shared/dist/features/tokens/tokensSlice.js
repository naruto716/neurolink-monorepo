import { createSlice } from '@reduxjs/toolkit';
// Define the initial state
const initialState = {
    accessToken: undefined,
    idToken: undefined,
    refreshToken: undefined,
    groups: undefined,
};
// Create the tokens slice
export const tokensSlice = createSlice({
    name: 'tokens',
    initialState,
    reducers: {
        setTokens: (state, action) => {
            const { accessToken, idToken, refreshToken, groups } = action.payload;
            state.accessToken = accessToken;
            state.idToken = idToken;
            state.refreshToken = refreshToken;
            state.groups = groups;
        },
        clearTokens: (state) => {
            state.accessToken = undefined;
            state.idToken = undefined;
            state.refreshToken = undefined;
            state.groups = undefined;
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
        },
        setIdToken: (state, action) => {
            state.idToken = action.payload;
        },
        setRefreshToken: (state, action) => {
            state.refreshToken = action.payload;
        },
        setGroups: (state, action) => {
            state.groups = action.payload;
        },
    },
});
// Export actions and reducer
export const { setTokens, clearTokens, setAccessToken, setIdToken, setRefreshToken, setGroups } = tokensSlice.actions;
export default tokensSlice.reducer;
