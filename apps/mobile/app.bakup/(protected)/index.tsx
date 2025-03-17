import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedHomeScreen() {
  const { logout, authTokens } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Protected Home</Text>
      <Text style={styles.subtitle}>You are authenticated!</Text>
      
      {authTokens && (
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenText}>Access token available</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
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
  tokenInfo: {
    backgroundColor: '#e6f7ff',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenText: {
    color: '#0066cc',
  },
  button: {
    backgroundColor: '#ff3b30',
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
}); 