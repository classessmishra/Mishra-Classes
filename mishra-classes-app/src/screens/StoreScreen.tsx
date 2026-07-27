import React from 'react';
import { View, StyleSheet } from 'react-native';
import HybridWebView from '../components/HybridWebView';

export default function StoreScreen() {
  return (
    <View style={styles.container}>
      <HybridWebView path="/store" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
