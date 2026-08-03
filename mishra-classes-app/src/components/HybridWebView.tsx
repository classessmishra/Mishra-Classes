import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Text, Platform, StatusBar as RNStatusBar, ToastAndroid, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useNotifications } from '../hooks/useNotifications';


// Replace this with the user's production URL or local network IP for testing
export const BASE_URL = 'https://mishra-classes.vercel.app';

interface HybridWebViewProps {
  path: string;
}

export default React.memo(function HybridWebView({ path }: HybridWebViewProps) {
  const { expoPushToken } = useNotifications();
  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const backPressCount = useRef(0);

  // Handle hardware back button for Android
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // Prevent default behavior (exiting app)
        }
        
        // If canGoBack is false, check if we are on a main nav section
        const isNavBarSection = 
          currentUrl.endsWith('/batches') || 
          currentUrl.endsWith('/chats') || 
          currentUrl.endsWith('/chats/student') || 
          currentUrl.endsWith('/store') || 
          currentUrl.endsWith('/student') || 
          currentUrl.endsWith('/admin');
          
        if (isNavBarSection && webViewRef.current) {
          // Tell Next.js to go to the Home tab
          webViewRef.current.injectJavaScript(`window.dispatchEvent(new CustomEvent('go-home')); true;`);
          return true;
        }

        // If we are at the root or an unknown state, require double press to exit
        if (backPressCount.current === 1) {
          return false; // Exit app on second press
        }
        
        backPressCount.current = 1;
        
        // Let the webview try to go back anyway (might trigger popstate)
        if (webViewRef.current) {
           webViewRef.current.goBack();
        }

        // Reset the counter after 2 seconds
        setTimeout(() => {
          backPressCount.current = 0;
        }, 2000);
        
        // Show a toast message on Android
        if (Platform.OS === 'android') {
          ToastAndroid.show('Press back again to exit app', ToastAndroid.SHORT);
        }
        
        return true; // Prevent default behavior (exiting app)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [canGoBack])
  );

  const handleFullscreen = useCallback(async (fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
    if (fullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    }
  }, []);

  React.useEffect(() => {
    if (expoPushToken && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.expoPushToken = '${expoPushToken}';
        window.dispatchEvent(new CustomEvent('expoPushToken', { detail: '${expoPushToken}' }));
        true;
      `);
    }
  }, [expoPushToken, currentUrl]);



  const onNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  }, []);

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'FULLSCREEN') {
        handleFullscreen(data.value);
      }
    } catch(e) {}
  }, [handleFullscreen]);

  return (
    <View style={[styles.container, isFullscreen && { paddingTop: 0, backgroundColor: 'black' }]}>
      <StatusBar style="light" hidden={isFullscreen} backgroundColor="#5B58FF" />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: `${BASE_URL}${path}` }}
        style={styles.webview}
        pullToRefreshEnabled={true}
        nestedScrollEnabled={true}
        onNavigationStateChange={onNavigationStateChange}
        onMessage={onMessage}
        renderLoading={() => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', position: 'absolute', width: '100%', height: '100%' }}>
            <ActivityIndicator size="large" color="#5B58FF" />
          </View>
        )}
        startInLoadingState={true}
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20 }}>
            <View style={{ backgroundColor: '#fee2e2', padding: 16, borderRadius: 50, marginBottom: 20 }}>
              <Text style={{ fontSize: 32 }}>📶</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 10 }}>No Internet Connection</Text>
            <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
              Please check your network connection and try again.
            </Text>
            <View 
              onTouchEnd={() => webViewRef.current?.reload()}
              style={{ backgroundColor: '#5B58FF', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 100 }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Retry Connection</Text>
            </View>
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        javaScriptCanOpenWindowsAutomatically={true}
        // @ts-ignore
        onPermissionRequest={(request: any) => {
          if (Platform.OS === 'android') {
            request.grant();
          }
        }}
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:blank')) {
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              }
            }).catch(() => {});
            return false;
          }
          return true;
        }}
        bounces={true}
        overScrollMode="never"
        scalesPageToFit={false}
        userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36"
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
          document.getElementsByTagName('head')[0].appendChild(meta);
          
          const style = document.createElement('style');
          style.innerHTML = \`
            body { -webkit-user-select: none; user-select: none; }
            ::-webkit-scrollbar { display: none !important; }
            #web-bottom-nav { display: none !important; }
          \`;
          document.head.appendChild(style);
          true;
        `}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B58FF', // Matches Navbar color
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});
