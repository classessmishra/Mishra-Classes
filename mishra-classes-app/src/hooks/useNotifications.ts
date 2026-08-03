import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { navigationRef } from '../navigationRef';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data;
      
      if (data && navigationRef.isReady()) {
        if (data.type === 'CHAT' && data.groupId) {
          // @ts-ignore
          navigationRef.navigate('Chats', { path: `/chats/student?group=${data.groupId}` });
        } else if (data.type === 'LIVE_CLASS') {
          // @ts-ignore
          navigationRef.navigate('Home', { path: `/student/live-class/${data.youtubeVideoId}` });
        } else if (data.type === 'ANNOUNCEMENT') {
          const path = data.linkUrl || `/student/batches/${data.batchId}`;
          // @ts-ignore
          navigationRef.navigate('Batches', { path });
        } else if (data.type === 'ATTENDANCE') {
          // @ts-ignore
          navigationRef.navigate('Home', { path: `/student` });
        } else if (data.type === 'TEST' && data.testId) {
          // @ts-ignore
          navigationRef.navigate('Home', { path: `/test/${data.testId}` });
        } else if (typeof data.path === 'string') {
          // Fallback generic path: Try to guess the correct tab
          let tab = 'Home';
          if (data.path.startsWith('/chats')) tab = 'Chats';
          else if (data.path.startsWith('/store')) tab = 'Store';
          else if (data.path.startsWith('/student/batches')) tab = 'Batches';
          else if (data.path.startsWith('/student/profile') || data.path === '/login') tab = 'Profile';
          
          // @ts-ignore
          navigationRef.navigate(tab, { path: data.path });
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    // Skip push token generation in Expo Go since it's unsupported
    if (Constants.appOwnership === 'expo') {
      console.log('Push notifications are not supported in Expo Go. Skipping token generation.');
      return;
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? 'your-project-id', 
      })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log('Failed to fetch push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
