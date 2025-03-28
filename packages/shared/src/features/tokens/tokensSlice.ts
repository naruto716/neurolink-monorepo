import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SharedRootState, SharedStateSelector } from '../../app/store/store';

// Define the type for token state
export interface TokensState {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  groups?: string[];
}

// Define the initial state
const initialState: TokensState = {
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
    setTokens: (state, action: PayloadAction<TokensState>) => {
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
    setAccessToken: (state, action: PayloadAction<string | undefined>) => {
      state.accessToken = action.payload;
      console.log('Access token updated');
    },
    setIdToken: (state, action: PayloadAction<string | undefined>) => {
      state.idToken = action.payload;
    },
    setRefreshToken: (state, action: PayloadAction<string | undefined>) => {
      state.refreshToken = action.payload;
    },
    setGroups: (state, action: PayloadAction<string[] | undefined>) => {
      state.groups = action.payload;
    },
  },
});

// Selectors - Use SharedStateSelector and explicitly type state
export const selectAccessToken: SharedStateSelector< string | undefined > = (state: SharedRootState) => state.tokens?.accessToken;
export const selectIdToken: SharedStateSelector< string | undefined > = (state: SharedRootState) => state.tokens?.idToken;
export const selectRefreshToken: SharedStateSelector< string | undefined > = (state: SharedRootState) => state.tokens?.refreshToken;
export const selectGroups: SharedStateSelector<string[]> = (state: SharedRootState) => state.tokens?.groups || [];

// Export actions and reducer
export const { 
  setTokens, 
  clearTokens, 
  setAccessToken, 
  setIdToken, 
  setRefreshToken,
  setGroups
} = tokensSlice.actions;

export default tokensSlice.reducer; 