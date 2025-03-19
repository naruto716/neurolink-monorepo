import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '@neurolink/shared';

/**
 * Component to display the Redux state for testing purposes
 */
export default function ReduxStateViewer() {
  const tokens = useAppSelector(state => state.tokens);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redux State</Text>
      <ScrollView style={styles.stateContainer}>
        <Text style={styles.stateLabel}>Tokens:</Text>
        <Text style={styles.stateText}>
          {JSON.stringify(tokens, null, 2)}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stateContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
  },
  stateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stateText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
}); 