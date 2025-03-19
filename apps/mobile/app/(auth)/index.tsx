import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import ReduxStateViewer from '@/components/ReduxStateViewer';
import { RefreshTokenButton } from '@/components/RefreshTokenButton';
import {jwtDecode} from 'jwt-decode';

export default function LoginScreen() {
  const { login, logout, error, isLoggedIn, authTokens } = useAuth();

  // Add debug log to check when the component re-renders
  useEffect(() => {
    if (authTokens?.accessToken) {
      console.log(`LoginScreen: Tokens present at ${new Date().toISOString()}:`, 
        authTokens.accessToken.substring(0, 15) + '...');
    } else {
      console.log(`LoginScreen: No tokens at ${new Date().toISOString()}`);
    }
  }, [authTokens]);

  // Check token expiration status
  const tokenStatus = useMemo(() => {
    if (!authTokens?.accessToken) return { status: 'unknown', expiresIn: null };
    
    try {
      const decoded = jwtDecode<{exp: number}>(authTokens.accessToken);
      if (!decoded.exp) return { status: 'unknown', expiresIn: null };
      
      const nowSec = Math.floor(Date.now() / 1000);
      const expiresInSec = decoded.exp - nowSec;
      
      if (expiresInSec <= 0) {
        return { status: 'expired', expiresIn: 0 };
      } else if (expiresInSec < 300) { // less than 5 minutes
        return { status: 'expiring-soon', expiresIn: expiresInSec };
      } else {
        return { status: 'valid', expiresIn: expiresInSec };
      }
    } catch (e) {
      return { status: 'error', expiresIn: null };
    }
  }, [authTokens]);

  // Get appropriate status message and color
  const getStatusDisplay = () => {
    if (!isLoggedIn) return null;
    
    let message = '';
    let color = '';
    
    switch (tokenStatus.status) {
      case 'expired':
        message = 'Token expired. Please refresh.';
        color = '#dc3545'; // red
        break;
      case 'expiring-soon':
        const mins = Math.floor((tokenStatus.expiresIn || 0) / 60);
        message = `Token expires in ${mins} minutes. Consider refreshing.`;
        color = '#ffc107'; // yellow/warning
        break;
      case 'valid':
        const hours = Math.floor((tokenStatus.expiresIn || 0) / 3600);
        const remainingMins = Math.floor(((tokenStatus.expiresIn || 0) % 3600) / 60);
        message = `Token valid for ${hours}h ${remainingMins}m`;
        color = '#28a745'; // green
        break;
      case 'error':
        message = 'Could not check token status';
        color = '#6c757d'; // gray
        break;
      default:
        message = 'Unknown token status';
        color = '#6c757d'; // gray
    }
    
    return (
      <View style={[styles.statusContainer, {borderColor: color}]}>
        <Text style={[styles.statusText, {color}]}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Neurolink</Text>
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      {isLoggedIn ? (
        <>
          <Text style={styles.subtitle}>You are logged in</Text>
          
          {getStatusDisplay()}
          
          <ScrollView style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Your Auth Context Tokens:</Text>
            <Text style={styles.tokenText}>
              {JSON.stringify(authTokens, null, 2)}
            </Text>
          </ScrollView>
          
          {/* Display Redux state */}
          <ReduxStateViewer />
          
          <RefreshTokenButton 
            style={styles.refreshButton} 
            label="Refresh Tokens" 
            debug={true} 
          />
          
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          <TouchableOpacity style={styles.button} onPress={login}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  tokenContainer: {
    width: '100%',
    maxHeight: 300,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  refreshButton: {
    backgroundColor: '#28a745',
    alignSelf: 'stretch',
    marginTop: 20,
  },
  statusContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 