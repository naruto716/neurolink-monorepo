import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import { useAppSelector } from '@neurolink/shared';

interface RefreshTokenButtonProps {
  label?: string;
  style?: object;
  debug?: boolean;
}

// Helper to get expiry date from token
const getExpiryInfo = (token?: string): string => {
  if (!token) return 'No token';
  
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    if (!exp) return 'No expiry';
    
    const expiryDate = new Date(exp * 1000);
    return expiryDate.toLocaleTimeString();
  } catch (e) {
    return 'Invalid token';
  }
};

export const RefreshTokenButton: React.FC<RefreshTokenButtonProps> = ({
  label = 'Refresh Session',
  style = {},
  debug = false
}) => {
  const { manualRefresh, authTokens } = useAuth();
  const reduxTokens = useAppSelector(state => state.tokens);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshStatus, setLastRefreshStatus] = useState<string | null>(null);

  const handleRefresh = async () => {
    console.log('RefreshTokenButton: Refresh button pressed');
    setIsRefreshing(true);
    
    // Get the current token expiry times for debug info
    const contextExpiry = getExpiryInfo(authTokens?.accessToken);
    const reduxExpiry = getExpiryInfo(reduxTokens?.accessToken);
    
    setLastRefreshStatus(
      `Starting refresh...\nContext token: ${contextExpiry}\nRedux token: ${reduxExpiry}`
    );
    
    try {
      console.log('RefreshTokenButton: Calling manualRefresh()');
      const result = await manualRefresh();
      console.log('RefreshTokenButton: manualRefresh completed with result:', result);
      
      // Get new token expiry for comparison
      const newContextExpiry = getExpiryInfo(authTokens?.accessToken);
      const newReduxExpiry = getExpiryInfo(reduxTokens?.accessToken);
      
      // Check for sync issues between context and Redux
      const inSync = authTokens?.accessToken === reduxTokens?.accessToken;
      
      if (result) {
        setLastRefreshStatus(
          `✅ Success: Token refreshed\nContext token: ${newContextExpiry}\nRedux token: ${newReduxExpiry}\nTokens in sync: ${inSync ? 'Yes' : 'No'}`
        );
      } else {
        setLastRefreshStatus(
          `❌ Failed: See console for details\nContext token: ${newContextExpiry}\nRedux token: ${newReduxExpiry}\nTokens in sync: ${inSync ? 'Yes' : 'No'}`
        );
      }
    } catch (error) {
      console.error('RefreshTokenButton: Error during refresh:', error);
      
      const newContextExpiry = getExpiryInfo(authTokens?.accessToken);
      const newReduxExpiry = getExpiryInfo(reduxTokens?.accessToken);
      const inSync = authTokens?.accessToken === reduxTokens?.accessToken;
      
      setLastRefreshStatus(
        `❌ Error: ${error}\nContext token: ${newContextExpiry}\nRedux token: ${newReduxExpiry}\nTokens in sync: ${inSync ? 'Yes' : 'No'}`
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </TouchableOpacity>
      
      {debug && lastRefreshStatus && (
        <Text style={styles.debugText}>{lastRefreshStatus}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 