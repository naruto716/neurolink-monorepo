import { PayloadAction } from '@reduxjs/toolkit';
export interface TokensState {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    groups?: string[];
}
export declare const tokensSlice: import("@reduxjs/toolkit").Slice<TokensState, {
    setTokens: (state: import("immer").WritableDraft<TokensState>, action: PayloadAction<TokensState>) => void;
    clearTokens: (state: import("immer").WritableDraft<TokensState>) => void;
    setAccessToken: (state: import("immer").WritableDraft<TokensState>, action: PayloadAction<string | undefined>) => void;
    setIdToken: (state: import("immer").WritableDraft<TokensState>, action: PayloadAction<string | undefined>) => void;
    setRefreshToken: (state: import("immer").WritableDraft<TokensState>, action: PayloadAction<string | undefined>) => void;
    setGroups: (state: import("immer").WritableDraft<TokensState>, action: PayloadAction<string[] | undefined>) => void;
}, "tokens", "tokens", import("@reduxjs/toolkit").SliceSelectors<TokensState>>;
export declare const setTokens: import("@reduxjs/toolkit").ActionCreatorWithPayload<TokensState, "tokens/setTokens">, clearTokens: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"tokens/clearTokens">, setAccessToken: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<string | undefined, "tokens/setAccessToken">, setIdToken: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<string | undefined, "tokens/setIdToken">, setRefreshToken: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<string | undefined, "tokens/setRefreshToken">, setGroups: import("@reduxjs/toolkit").ActionCreatorWithOptionalPayload<string[] | undefined, "tokens/setGroups">;
declare const _default: import("redux").Reducer<TokensState>;
export default _default;
