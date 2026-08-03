import React from 'react';
import { View, StyleSheet } from 'react-native';
import HybridWebView from '../components/HybridWebView';

export default React.memo(function ProfileScreen({ route }: any) {
  const path = route?.params?.path || '/student/profile';

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
