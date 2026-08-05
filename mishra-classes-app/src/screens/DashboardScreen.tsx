import React from 'react';
import { View, StyleSheet } from 'react-native';
import HybridWebView from '../components/HybridWebView';

export default React.memo(function DashboardScreen({ route }: any) {
  const path = route?.params?.path || '/student';

  return (
    <View style={styles.container}>
      <HybridWebView path={path} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
