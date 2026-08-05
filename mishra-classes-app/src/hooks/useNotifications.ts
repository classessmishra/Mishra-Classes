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

/**
 * Routes user to the exact target location when a notification is tapped.
 */
export function handleNotificationRouting(data: any) {
  if (!data) return;
  console.log('[Notification Router] Received data:', data);

  let targetPath = '';
  let targetTab = 'Home';

  // 1. Attendance Notification -> Go directly to Batch Attendance tab
  if (data.type === 'ATTENDANCE') {
    if (data.batchId) {
      targetPath = `/batches/${data.batchId}?tab=attendance`;
      targetTab = 'Batches';
    } else {
      targetPath = '/student/batches';
      targetTab = 'Batches';
    }
  } 
  // 2. Live Class Notification -> Join Live Room instantly
  else if (data.type === 'LIVE_CLASS') {
    const classId = data.classId || data.youtubeVideoId || '';
    if (classId) {
      targetPath = `/student/live-class/${classId}`;
    } else {
      targetPath = '/student';
    }
    targetTab = 'Home';
  } 
  // 3. Batch Announcement -> Open Batch Announcements tab or custom link
  else if (data.type === 'ANNOUNCEMENT') {
    if (data.linkUrl) {
      targetPath = data.linkUrl;
      targetTab = data.linkUrl.includes('/batches') ? 'Batches' : 'Home';
    } else if (data.batchId) {
      targetPath = `/batches/${data.batchId}?tab=announcement`;
      targetTab = 'Batches';
    } else {
      targetPath = '/batches';
      targetTab = 'Batches';
    }
  } 
  // 4. Test / Assessment -> Open the Test taking interface
  else if (data.type === 'TEST') {
    if (data.testId) {
      targetPath = `/test/${data.testId}`;
    } else {
      targetPath = '/student/tests';
    }
    targetTab = 'Home';
  } 
  // 5. Chat Notification -> Open active chat conversation
  else if (data.type === 'CHAT') {
    if (data.groupId) {
      targetPath = `/chats/student?group=${data.groupId}`;
    } else {
      targetPath = '/chats/student';
    }
    targetTab = 'Chats';
  } 
  // 6. Course Purchase / Update
  else if (data.type === 'COURSE') {
    if (data.courseId) {
      targetPath = `/student/courses/${data.courseId}`;
    } else {
      targetPath = '/store';
    }
    targetTab = 'Store';
  } 
  // 7. Generic path payload
  else if (typeof data.path === 'string' && data.path) {
    targetPath = data.path;
    if (targetPath.startsWith('/chats')) targetTab = 'Chats';
    else if (targetPath.startsWith('/store')) targetTab = 'Store';
    else if (targetPath.startsWith('/batches') || targetPath.startsWith('/student/batches')) targetTab = 'Batches';
    else if (targetPath.startsWith('/student')) targetTab = 'Dashboard';
    else targetTab = 'Home';
  }

  if (targetPath && navigationRef.isReady()) {
    console.log(`[Notification Router] Navigating to Tab: ${targetTab}, Path: ${targetPath}`);
    // @ts-ignore
    navigationRef.navigate(targetTab, { path: targetPath, timestamp: Date.now() });
  } else {
    // If navigationRef is not ready yet, retry after a short delay
    setTimeout(() => {
      if (targetPath && navigationRef.isReady()) {
        console.log(`[Notification Router (Retry)] Navigating to Tab: ${targetTab}, Path: ${targetPath}`);
        // @ts-ignore
        navigationRef.navigate(targetTab, { path: targetPath, timestamp: Date.now() });
      }
    }, 800);
  }
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
  const [notification, setNotification] = useState<Notifications.Notification | false>(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Handle incoming notification while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Handle user tapping on a notification (Background / Foreground)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response?.notification?.request?.content?.data;
      handleNotificationRouting(data);
    });

    // Handle cold-start: App opened directly from tapping a notification when closed
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response?.notification?.request?.content?.data) {
        setTimeout(() => {
          handleNotificationRouting(response.notification.request.content.data);
        }, 1000);
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
      const projectId = 
        Constants.easConfig?.projectId ?? 
        Constants.expoConfig?.extra?.eas?.projectId ?? 
        '2a0db862-19e6-4062-aeb9-3abbbcfc264d';

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
    } catch (e: any) {
      console.log('Failed to fetch push token:', e);
      if (__DEV__) {
        alert(`Push Token Error: ${e.message}`);
      }
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
