import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAppSelector, useAppDispatch, setTokens } from '@neurolink/shared';
import { useAuth } from '@/context/AuthContext';
import { jwtDecode } from 'jwt-decode';

// Helper to get token info
const getTokenInfo = (token?: string): string => {
  if (!token) return 'No token';
  
  try {
    // Show first 10 chars of token for comparison
    const shortToken = token.substring(0, 10) + '...';
    
    const { exp } = jwtDecode<{ exp: number }>(token);
    if (!exp) return `${shortToken} (No expiry)`;
    
    const expiryDate = new Date(exp * 1000);
    return `${shortToken} (Expires: ${expiryDate.toLocaleTimeString()})`;
  } catch (e) {
    return `${token.substring(0, 10)}... (Invalid token)`;
  }
};

/**
 * Component to display the Redux state for testing purposes
 */
export default function ReduxStateViewer() {
  const tokens = useAppSelector(state => state.tokens);
  const { authTokens } = useAuth();
  const dispatch = useAppDispatch();
  const [lastChecked, setLastChecked] = useState(new Date());
  const [syncForced, setSyncForced] = useState(false);
  
  // Update the last checked time every 5 seconds to show token status
  useEffect(() => {
    const interval = setInterval(() => {
      setLastChecked(new Date());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Check if tokens are in sync
  const tokensInSync = authTokens?.accessToken === tokens?.accessToken;
  
  const refreshView = () => {
    setLastChecked(new Date());
    setSyncForced(false);
  };
  
  // Function to force sync tokens between Context and Redux
  const forceSync = () => {
    if (!authTokens) return;
    
    console.log('ReduxStateViewer: Forcing token sync with Redux');
    dispatch(setTokens({
      accessToken: authTokens.accessToken,
      idToken: authTokens.idToken,
      refreshToken: authTokens.refreshToken,
      groups: undefined
    }));
    
    setSyncForced(true);
    setTimeout(() => {
      setLastChecked(new Date());
    }, 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Token Sync Status</Text>
        <TouchableOpacity onPress={refreshView} style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.syncStatus, 
        { backgroundColor: tokensInSync ? '#d4edda' : '#f8d7da' }]}>
        <Text style={[styles.syncStatusText, 
          { color: tokensInSync ? '#155724' : '#721c24' }]}>
          {tokensInSync ? 'Tokens in sync ✓' : 'Tokens OUT OF SYNC ✗'}
        </Text>
        <Text style={styles.timestampText}>
          Last checked: {lastChecked.toLocaleTimeString()}
          {syncForced && ' (Manually synced)'}
        </Text>
        
        {!tokensInSync && (
          <TouchableOpacity onPress={forceSync} style={styles.forceSyncButton}>
            <Text style={styles.forceSyncText}>Force Sync Now</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.stateContainer}>
        <Text style={styles.sectionTitle}>Auth Context Tokens:</Text>
        <Text style={styles.tokenLabel}>Access Token:</Text>
        <Text style={styles.tokenText}>{getTokenInfo(authTokens?.accessToken)}</Text>
        
        <Text style={styles.sectionTitle}>Redux Store Tokens:</Text>
        <Text style={styles.tokenLabel}>Access Token:</Text>
        <Text style={styles.tokenText}>{getTokenInfo(tokens?.accessToken)}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#007bff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
  },
  syncStatus: {
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  syncStatusText: {
    fontWeight: 'bold',
  },
  timestampText: {
    fontSize: 12,
    marginTop: 2,
  },
  stateContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 8,
  },
  forceSyncButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
  },
  forceSyncText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 