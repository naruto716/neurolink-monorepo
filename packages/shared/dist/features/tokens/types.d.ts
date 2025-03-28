export interface TokensState {
    accessToken: string | null;
    idToken: string | null;
    refreshToken: string | null;
    groups: string[];
}
