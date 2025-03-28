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
            console.log('Tokens updated in Redux store');
        },
        clearTokens: (state) => {
            state.accessToken = undefined;
            state.idToken = undefined;
            state.refreshToken = undefined;
            state.groups = undefined;
            console.log('Tokens cleared from Redux store');
        },
        setAccessToken: (state, action) => {
            state.accessToken = action.payload;
            console.log('Access token updated');
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
// Selectors - Use SharedStateSelector and explicitly type state
export const selectAccessToken = (state) => state.tokens?.accessToken;
export const selectIdToken = (state) => state.tokens?.idToken;
export const selectRefreshToken = (state) => state.tokens?.refreshToken;
export const selectGroups = (state) => state.tokens?.groups || [];
// Export actions and reducer
export const { setTokens, clearTokens, setAccessToken, setIdToken, setRefreshToken, setGroups } = tokensSlice.actions;
export default tokensSlice.reducer;
