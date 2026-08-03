import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useNotifications } from './src/hooks/useNotifications';
// Import Screens
import HomeScreen from './src/screens/HomeScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';

import { Text, View, ScrollView, Platform } from 'react-native';

// Ignore Expo Go specific warning for Push Notifications
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#ffffff' }}>
          <Text style={{ color: '#ef4444', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
            {this.state.error.message}
          </Text>
          <ScrollView style={{ maxHeight: 200, width: '100%', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 8 }}>
            <Text style={{ color: '#334155', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

import { navigationRef } from './src/navigationRef';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
import { Home, Folder, ShoppingBag, MessageCircle, User } from 'lucide-react-native';

import BatchesScreen from './src/screens/BatchesScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import StoreScreen from './src/screens/StoreScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Optimize memory by using native OS screens
enableScreens(true);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = { headerShown: false };

// Native Tab Navigator Setup
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLazy: true, // Crucial for memory: only loads the tab when clicked
        unmountOnBlur: true, // Memory optimization: unmount webviews when switching away
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#5B58FF',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') return <Home color={color} size={24} />;
          if (route.name === 'Batches') return <Folder color={color} size={24} />;
          if (route.name === 'Store') return <ShoppingBag color={color} size={24} />;
          if (route.name === 'Chats') return <MessageCircle color={color} size={24} />;
          if (route.name === 'Profile') return <User color={color} size={24} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Batches" component={BatchesScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: ['mishraclasses://', 'https://mishraclasses.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: '*',
        }
      },
      VideoPlayer: 'video'
    },
  },
};

export default React.memo(function App() {
  const { expoPushToken } = useNotifications();

  useEffect(() => {
    if (expoPushToken) {
      // Logic to send expoPushToken to backend if user is logged in
      console.log('App ready. Push token:', expoPushToken);
    }
  }, [expoPushToken]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef} linking={linking}>
          <Stack.Navigator screenOptions={screenOptions}>
            {/* The main app wrapped in Tabs */}
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            
            {/* Video player stays outside tabs to be full screen */}
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ presentation: 'fullScreenModal' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
});
