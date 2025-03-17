import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { 
  useAuthRequest, 
  exchangeCodeAsync, 
  revokeAsync, 
  ResponseType, 
  makeRedirectUri,
  DiscoveryDocument
} from 'expo-auth-session';

// Proper domain configuration for Cognito
export const cognitoDomain = "https://ap-southeast-2cmjdrfofc.auth.ap-southeast-2.amazoncognito.com";

// Cognito configuration
const cognitoConfig = {
  authority: "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_cMjDRFoFC",
  client_id: "1a876t4gftennmng7milfuqucc",
  redirect_uri: "http://localhost:5000",
  response_type: "code",
  scope: "email openid phone",
  logout_uri: "http://localhost:5000"
};

// Mobile specific configuration
export const mobileCognitoConfig = {
  ...cognitoConfig,
  redirect_uri: "neurolink://", // Simple URI works for iOS
  logout_uri: "neurolink://"
};

type AuthTokens = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
};

interface AuthContextType {
  authTokens: AuthTokens | null;
  error: string | null;
  login: () => void;
  logout: () => void;
  loginWithDifferentAccount: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper discovery doc
const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${cognitoDomain}/oauth2/authorize`,
  tokenEndpoint: `${cognitoDomain}/oauth2/token`,
  revocationEndpoint: `${cognitoDomain}/oauth2/revoke`,
};

// Provide the context to the rest of the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authTokens, setAuthTokens] = useState<AuthTokens | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = makeRedirectUri({
    scheme: 'neurolink',
    path: Platform.OS === 'android' ? 'callback' : undefined,
  });

  // Setup the Auth request (PKCE by default in expo-auth-session)
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: mobileCognitoConfig.client_id,
      redirectUri,
      responseType: ResponseType.Code,
      scopes: mobileCognitoConfig.scope.split(' '),
      usePKCE: true,
    },
    discovery
  );

  // Handle code -> token exchange
  useEffect(() => {
    const doTokenExchange = async (code: string, verifier?: string) => {
      try {
        const tokenResult = await exchangeCodeAsync(
          {
            clientId: mobileCognitoConfig.client_id,
            code,
            redirectUri,
            extraParams: {
              code_verifier: verifier || '',
            },
          },
          discovery
        );
        // Set tokens
        setAuthTokens({
          accessToken: tokenResult.accessToken!,
          idToken: tokenResult.idToken,
          refreshToken: tokenResult.refreshToken,
        });
      } catch (err: any) {
        console.error('Token exchange failed:', err);
        setError(err.message || 'Unknown token exchange error');
        Alert.alert('Authentication Error', err.message || 'Unknown error');
      }
    };

    if (response?.type === 'success' && response.params.code) {
      // We got an auth code -> exchange for tokens
      doTokenExchange(response.params.code, request?.codeVerifier);
    } else if (response?.type === 'error') {
      setError('Authentication error');
      Alert.alert('Authentication Error', 'Something went wrong');
    }
  }, [response, request, redirectUri]);

  // Initiate login
  const login = () => {
    if (!request) return;
    promptAsync().catch((err: Error) => {
      console.error('Error starting auth flow:', err);
      setError(err.message || 'Unknown error');
    });
  };

  // Full logout: revoke refresh token and do Cognito logout
  const logout = async () => {
    if (!authTokens?.refreshToken) {
      setAuthTokens(null);
      return;
    }
    try {
      await revokeAsync(
        {
          token: authTokens.refreshToken,
          clientId: mobileCognitoConfig.client_id,
        },
        discovery
      ).catch((error: Error) => {
        // Some endpoints respond with empty 200 -> parse error
        if (error instanceof SyntaxError && error.message.includes('JSON Parse error')) {
          console.log('Ignoring JSON parse error on revoke - likely empty response');
        } else {
          throw error;
        }
      });
      // Also do web-based logout to clear cookies
      const logoutUri = `${cognitoDomain}/logout?client_id=${mobileCognitoConfig.client_id}&logout_uri=${redirectUri}`;
      await WebBrowser.openAuthSessionAsync(logoutUri, redirectUri, {
        showInRecents: false,
        dismissButtonStyle: 'cancel',
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setAuthTokens(null);
    }
  };

  // Force re-login with a different account
  const loginWithDifferentAccount = async () => {
    // Log out first
    await logout();
    // Then do a fresh login
    setTimeout(() => {
      login();
    }, 500);
  };

  // Provide state + actions
  return (
    <AuthContext.Provider
      value={{
        authTokens,
        error,
        login,
        logout,
        loginWithDifferentAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for consumers to use
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
