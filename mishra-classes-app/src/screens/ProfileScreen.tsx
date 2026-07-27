import React from 'react';
import { View, StyleSheet } from 'react-native';
import HybridWebView from '../components/HybridWebView';

export default function ProfileScreen() {
  // Pass a query param to tell the web app to redirect to /login if unauthenticated
  // and /student if authenticated
  return (
    <View style={styles.container}>
      <HybridWebView path="/login" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
