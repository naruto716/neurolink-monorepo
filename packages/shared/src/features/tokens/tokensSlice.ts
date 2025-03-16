import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the type for token state
export interface TokensState {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}

// Define the initial state
const initialState: TokensState = {
  accessToken: undefined,
  idToken: undefined,
  refreshToken: undefined,
};

// Create the tokens slice
export const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<TokensState>) => {
      const { accessToken, idToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.idToken = idToken;
      state.refreshToken = refreshToken;
    },
    clearTokens: (state) => {
      state.accessToken = undefined;
      state.idToken = undefined;
      state.refreshToken = undefined;
    },
    setAccessToken: (state, action: PayloadAction<string | undefined>) => {
      state.accessToken = action.payload;
    },
    setIdToken: (state, action: PayloadAction<string | undefined>) => {
      state.idToken = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string | undefined>) => {
      state.refreshToken = action.payload;
    },
  },
});

// Export actions and reducer
export const { 
  setTokens, 
  clearTokens, 
  setAccessToken, 
  setIdToken, 
  setRefreshToken 
} = tokensSlice.actions;

export default tokensSlice.reducer; 