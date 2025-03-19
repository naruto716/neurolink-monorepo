import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef
} from 'react';
import { Alert, Platform } from 'react-native';
import {jwtDecode} from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import {
  useAuthRequest,
  exchangeCodeAsync,
  refreshAsync,
  revokeAsync,
  ResponseType,
  makeRedirectUri,
  DiscoveryDocument
} from 'expo-auth-session';

// ----------------------------------------------------------------------------
// Cognito config
// ----------------------------------------------------------------------------
const cognitoDomain = 'https://ap-southeast-2cmjdrfofc.auth.ap-southeast-2.amazoncognito.com';
const clientId = '1a876t4gftennmng7milfuqucc';

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${cognitoDomain}/oauth2/authorize`,
  tokenEndpoint: `${cognitoDomain}/oauth2/token`,
  revocationEndpoint: `${cognitoDomain}/oauth2/revoke`
};

// Example scopes
const scopes = ['openid', 'email', 'phone'];

// Mobile deep link for redirect:
const redirectUri = makeRedirectUri({
  scheme: 'neurolink',
  path: Platform.OS === 'android' ? 'callback' : undefined
});

const AUTH_TOKEN_KEY = 'AUTH_TOKEN_KEY';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------
export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
};

interface AuthContextType {
  authTokens: AuthTokens | null;
  isLoggedIn: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  loginWithDifferentAccount: () => void;
  refreshTokens: (tokensParam?: AuthTokens) => Promise<void>;
  manualRefresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------------------------------------------------------------------
// AuthProvider
// ----------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(null);
  const [error, setError] = useState<string | null>(null);

  // We store a ref to the timer so we can clear it if tokens change
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add a flag to track if we've already initialized tokens to prevent multiple refreshes
  const hasInitializedRef = useRef(false);
  // Add a flag to prevent rapid consecutive refreshes
  const isRefreshingRef = useRef(false);

  // --------------------------------------------------------------------------
  // Helper: Store / Load / Remove tokens from AsyncStorage
  // --------------------------------------------------------------------------
  const saveTokensToStorage = useCallback(async (tokens: AuthTokens) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokens));
    } catch (err) {
      console.error('Error saving tokens to AsyncStorage:', err);
    }
  }, []);

  const loadTokensFromStorage = useCallback(async (): Promise<AuthTokens | null> => {
    try {
      const value = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return value ? (JSON.parse(value) as AuthTokens) : null;
    } catch (err) {
      console.error('Error loading tokens from AsyncStorage:', err);
      return null;
    }
  }, []);

  const removeTokensFromStorage = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (err) {
      console.error('Error removing tokens from AsyncStorage:', err);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Helper: Cancel any existing refresh timer
  // --------------------------------------------------------------------------
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // --------------------------------------------------------------------------
  // Forward declaration for scheduleRefresh since it has circular dependency with refreshTokens
  // --------------------------------------------------------------------------  
  // Use a ref instead of Object.assign to handle the circular dependency
  const refreshTokensRef = useRef<(tokensParam?: AuthTokens) => Promise<void>>(async () => {});

  // --------------------------------------------------------------------------
  // Schedule a refresh using a timer
  //   - Refresh 60 seconds before the token actually expires
  // --------------------------------------------------------------------------
  const scheduleRefresh = useCallback<(tokens: AuthTokens) => void>(
    (tokens: AuthTokens) => {
      clearRefreshTimer();

      try {
        const { exp } = jwtDecode<{ exp: number }>(tokens.accessToken);
        if (!exp) {
          // If there's no expiration, skip
          return;
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const secondsUntilExpiry = exp - nowSec;
        // We'll refresh 60 seconds before expiry
        const refreshInSeconds = secondsUntilExpiry - 60;

        if (refreshInSeconds > 0) {
          const refreshTimeMs = refreshInSeconds * 1000;
          const timerId = setTimeout(() => {
            refreshTokensRef.current(tokens);
          }, refreshTimeMs);

          refreshTimerRef.current = timerId;
        } else {
          // If it's already within 60s of expiry or expired, refresh immediately
          refreshTokensRef.current(tokens);
        }
      } catch (err) {
        console.error('Error scheduling refresh:', err);
      }
    },
    [clearRefreshTimer]
  );

  // --------------------------------------------------------------------------
  // Refresh tokens - create the actual function
  // --------------------------------------------------------------------------
  const refreshTokens = useCallback(
    async (tokensParam?: AuthTokens) => {
      // Check if we're already refreshing to prevent multiple simultaneous refreshes
      if (isRefreshingRef.current) {
        console.log('Token refresh already in progress, skipping', new Date().toISOString());
        return;
      }
      
      console.log('Token refresh attempted', new Date().toISOString());
      isRefreshingRef.current = true;
      
      try {
        const currentTokens = tokensParam || authTokens;
        if (!currentTokens?.refreshToken) {
          // If there's no refresh token, nothing to do
          console.log('No refresh token available, skipping refresh');
          return;
        }

        const result = await refreshAsync(
          {
            clientId,
            refreshToken: currentTokens.refreshToken
          },
          discovery
        );

        if (result.accessToken) {
          console.log('Token refresh successful', new Date().toISOString());
          const updated: AuthTokens = {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken ?? currentTokens.refreshToken,
            idToken: result.idToken ?? currentTokens.idToken
          };
          
          // Force a re-render and update by creating a new token object
          // This ensures that the context value changes and triggers re-renders
          console.log('Setting new auth tokens to trigger context update');
          setAuthTokens({...updated});
          
          // Then save to storage and schedule refresh
          await saveTokensToStorage(updated);
          scheduleRefresh(updated);
        } else {
          throw new Error('Refresh response missing access token');
        }
      } catch (err: any) {
        console.error('Failed to refresh tokens:', err);
        // Handle token refresh failure
        setError(err.message || 'Failed to refresh authentication');
        
        // For silent refreshes, we don't want to log out automatically
        // But we should set a flag that tokens need refresh
        if (err.message?.includes('invalid_grant') || err.message?.includes('expired')) {
          console.log('Refresh token may be expired');
          // Don't clear tokens here - let the manual refresh handle that
        }
      } finally {
        // Reset refreshing flag when done
        isRefreshingRef.current = false;
      }
    },
    [authTokens, saveTokensToStorage, scheduleRefresh]
  );
  
  // Update the ref with the actual implementation
  refreshTokensRef.current = refreshTokens;

  // --------------------------------------------------------------------------
  // useAuthRequest - login flow
  // --------------------------------------------------------------------------
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      responseType: ResponseType.Code,
      scopes,
      usePKCE: true
    },
    discovery
  );

  // --------------------------------------------------------------------------
  // Exchange the code for tokens
  // --------------------------------------------------------------------------
  const doTokenExchange = useCallback(
    async (code: string, verifier?: string) => {
      try {
        const tokenResult = await exchangeCodeAsync(
          {
            clientId,
            code,
            redirectUri,
            extraParams: {
              code_verifier: verifier || ''
            }
          },
          discovery
        );

        const newTokens: AuthTokens = {
          accessToken: tokenResult.accessToken!,
          refreshToken: tokenResult.refreshToken,
          idToken: tokenResult.idToken
        };

        setAuthTokens(newTokens);
        await saveTokensToStorage(newTokens);
        scheduleRefresh(newTokens);
      } catch (err: any) {
        console.error('Token exchange failed:', err);
        setError(err.message || 'Unknown token exchange error');
        Alert.alert('Authentication Error', err.message || 'Unknown error');
      }
    },
    [saveTokensToStorage, scheduleRefresh]
  );

  // --------------------------------------------------------------------------
  // Handle OAuth response
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      doTokenExchange(response.params.code, request?.codeVerifier);
    } else if (response?.type === 'error') {
      setError('Authentication error');
      Alert.alert('Authentication Error', 'Something went wrong');
    }
  }, [response, request, doTokenExchange]);

  // --------------------------------------------------------------------------
  // On app startup: load stored tokens
  //   - If tokens exist, set them to state, schedule refresh
  //   - Then refresh immediately (since you requested it)
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Only run the initialization once
    if (hasInitializedRef.current) {
      console.log('Skipping token initialization - already initialized');
      return;
    }
    
    console.log('App startup - checking stored tokens');
    hasInitializedRef.current = true;
    
    (async () => {
      const storedTokens = await loadTokensFromStorage();
      if (storedTokens) {
        console.log('Found stored tokens, setting state and scheduling refresh');
        setAuthTokens(storedTokens);
        scheduleRefresh(storedTokens);

        // Specifically refresh tokens immediately whenever the app opens
        if (storedTokens.refreshToken) {
          console.log('Refreshing tokens on app startup');
          // Small delay to ensure state is updated
          setTimeout(() => {
            refreshTokensRef.current(storedTokens);
          }, 500);
        }
      } else {
        console.log('No stored tokens found during app startup');
      }
    })();

    // Cleanup on unmount: clear any refresh timer
    return () => {
      clearRefreshTimer();
    };
  }, [loadTokensFromStorage, scheduleRefresh, clearRefreshTimer]);

  // --------------------------------------------------------------------------
  // Auth Actions: login, logout, loginWithDifferentAccount
  // --------------------------------------------------------------------------
  const login = useCallback(() => {
    if (!request) return;
    promptAsync().catch((err: Error) => {
      console.error('Error starting auth flow:', err);
      setError(err.message || 'Unknown error');
    });
  }, [request, promptAsync]);

  const logout = useCallback(async () => {
    // Revoke refresh token if we have it
    if (authTokens?.refreshToken) {
      try {
        await revokeAsync(
          {
            token: authTokens.refreshToken,
            clientId
          },
          discovery
        ).catch((error: Error) => {
          // Some endpoints respond with empty 200 -> parse error
          if (
            error instanceof SyntaxError &&
            error.message.includes('JSON Parse error')
          ) {
            console.log('Ignoring JSON parse error on revoke - likely empty response');
          } else {
            throw error;
          }
        });

        // Also do hosted UI logout
        const logoutUri = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${redirectUri}`;
        await WebBrowser.openAuthSessionAsync(logoutUri, redirectUri, {
          showInRecents: false,
          dismissButtonStyle: 'cancel'
        });
      } catch (err) {
        console.error('Error during logout:', err);
      }
    }

    // Clear local state + storage + timer
    setAuthTokens(null);
    await removeTokensFromStorage();
    clearRefreshTimer();
  }, [authTokens, removeTokensFromStorage, clearRefreshTimer]);

  const loginWithDifferentAccount = useCallback(async () => {
    await logout();
    // Wait a bit, then launch a fresh login
    setTimeout(() => {
      login();
    }, 500);
  }, [logout, login]);

  // --------------------------------------------------------------------------
  // Provide context
  // --------------------------------------------------------------------------
  const manualRefresh = useCallback(async (): Promise<boolean> => {
    if (!authTokens?.refreshToken) {
      Alert.alert('Error', 'No refresh token available. Please log in again.');
      return false;
    }

    // Check if we're already refreshing
    if (isRefreshingRef.current) {
      Alert.alert('Already Refreshing', 'A token refresh is already in progress. Please wait...');
      return false;
    }

    try {
      // First, show in-progress alert
      Alert.alert('Refreshing', 'Attempting to refresh your session...');
      
      // Track initial token to compare later
      const initialTokenExpiry = authTokens.accessToken ? 
        getTokenExpiry(authTokens.accessToken) : null;
      
      // Manually set the refreshing flag - the refreshTokens function will reset it
      isRefreshingRef.current = true;
      
      // Store a copy of the starting tokens to check if they actually changed
      const startingTokenHash = authTokens?.accessToken || 'none';
      
      console.log('Manual refresh: Starting refresh from token hash:', 
        startingTokenHash.substring(0, 15) + '...');
      
      // Perform refresh - use the ref directly to ensure we always use the latest version
      await refreshTokensRef.current();
      
      // Delay slightly to ensure the state has updated with new tokens
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check if the token actually changed by comparing expiry times
      // This is more reliable than just checking if the function succeeded
      const newTokenExpiry = authTokens?.accessToken ? 
        getTokenExpiry(authTokens.accessToken) : null;
        
      const endingTokenHash = authTokens?.accessToken || 'none';
      console.log('Manual refresh: Ending refresh with token hash:', 
        endingTokenHash.substring(0, 15) + '...');
      
      const tokensChanged = startingTokenHash !== endingTokenHash;
      console.log('Manual refresh: Tokens changed?', tokensChanged);
      
      if (newTokenExpiry && initialTokenExpiry !== newTokenExpiry) {
        // Extra check: manually trigger a state update to ensure Redux sync
        if (authTokens) {
          console.log('Manual refresh: Force updating tokens to ensure Redux sync');
          setAuthTokens({...authTokens});
        }
        
        Alert.alert('Success', 'Your session has been refreshed successfully.');
        return true;
      } else {
        // Ensure refreshing flag is reset if the refresh didn't change the token
        isRefreshingRef.current = false;
        throw new Error('Token did not change after refresh');
      }
    } catch (err: any) {
      console.error('Manual refresh failed:', err);
      const errorMsg = err?.message || 'Unknown error occurred';
      Alert.alert('Refresh Failed', `Unable to refresh your session: ${errorMsg}. You may need to log in again.`);
      // Ensure refreshing flag is reset on error
      isRefreshingRef.current = false;
      return false;
    }
  }, [authTokens]);
  
  // Helper to get token expiry timestamp
  const getTokenExpiry = (token: string): number | null => {
    try {
      const { exp } = jwtDecode<{ exp: number }>(token);
      return exp || null;
    } catch (e) {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authTokens,
        isLoggedIn: !!authTokens,
        error,
        login,
        logout,
        loginWithDifferentAccount,
        refreshTokens,
        manualRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for consumers
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
