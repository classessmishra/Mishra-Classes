import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNotifications } from './src/hooks/useNotifications';

// Import Screens
import HomeScreen from './src/screens/HomeScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';

// Ignore Expo Go specific warning for Push Notifications
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

const Stack = createNativeStackNavigator();

export default function App() {
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    if (expoPushToken) {
      // Logic to send expoPushToken to backend if user is logged in
      console.log('App ready. Push token:', expoPushToken);
    }
  }, [expoPushToken]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
