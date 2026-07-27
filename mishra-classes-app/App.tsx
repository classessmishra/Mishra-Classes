import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Users, Store, MessageSquare, User } from 'lucide-react-native';
import { useNotifications } from './src/hooks/useNotifications';

// Import Screens
import HomeScreen from './src/screens/HomeScreen';
import BatchesScreen from './src/screens/BatchesScreen';
import StoreScreen from './src/screens/StoreScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';

// Ignore Expo Go specific warning for Push Notifications
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb', // blue-600
        tabBarInactiveTintColor: '#94a3b8', // slate-400
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Batches" 
        component={BatchesScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Store" 
        component={StoreScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

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
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ presentation: 'fullScreenModal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
