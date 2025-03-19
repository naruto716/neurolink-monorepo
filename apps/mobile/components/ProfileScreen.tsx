import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { RefreshTokenButton } from './RefreshTokenButton';

export const ProfileScreen = () => {
  const { isLoggedIn, authTokens, logout } = useAuth();

  // Simple function to get expiry time from token
  const getTokenExpiry = () => {
    if (!authTokens?.accessToken) return 'Not available';
    
    try {
      // Get expiry time (this assumes using jwt-decode which is already imported in AuthContext)
      const base64Url = authTokens.accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { exp } = JSON.parse(jsonPayload);
      if (exp) {
        const date = new Date(exp * 1000);
        return date.toLocaleString();
      }
      return 'Unknown';
    } catch (e) {
      return 'Error parsing token';
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Not logged in</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          <Text style={styles.label}>Access Token Expires:</Text>
          <Text style={styles.value}>{getTokenExpiry()}</Text>
        </View>
        
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Session Management</Text>
          <Text style={styles.description}>
            If you're experiencing issues with your session, you can manually refresh your tokens:
          </Text>
          <RefreshTokenButton style={styles.refreshButton} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 8,
  },
}); 