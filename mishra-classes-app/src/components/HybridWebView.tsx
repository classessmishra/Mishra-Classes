import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Text, Platform, StatusBar as RNStatusBar, ToastAndroid, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
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
          // Tell the Native App to switch to the Home tab
          navigation.navigate('Home' as never);
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

  // Auto-recover if tab is stuck on login page but user is logged in
  useFocusEffect(
    useCallback(() => {
      if (currentUrl.includes('/login') && path !== '/login' && webViewRef.current) {
        const fullUrl = `${BASE_URL}${path}`;
        webViewRef.current.injectJavaScript(`
          if (!document.cookie.includes('auth_role=')) {
            // User is truly logged out, do nothing
          } else {
            // User is logged in but stuck on login page, force reload to correct path
            window.location.href = '${fullUrl}';
          }
          true;
        `);
      }
    }, [currentUrl, path])
  );

  const handleFullscreen = useCallback(async (fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
    if (fullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    }
  }, []);

  const lastTargetUrl = useRef(`${BASE_URL}${path}`);

  React.useEffect(() => {
    if (path && webViewRef.current) {
      const fullUrl = `${BASE_URL}${path}`;
      if (lastTargetUrl.current !== fullUrl) {
        lastTargetUrl.current = fullUrl;
        webViewRef.current.injectJavaScript(`
          if (window.location.href !== '${fullUrl}') {
            window.location.href = '${fullUrl}';
          }
          true;
        `);
      }
    }
  }, [path]);

  React.useEffect(() => {
    if (expoPushToken && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.expoPushToken = '${expoPushToken}';
        window.dispatchEvent(new CustomEvent('expoPushToken', { detail: '${expoPushToken}' }));
        true;
      `);
    }
  }, [expoPushToken, currentUrl]);

  React.useEffect(() => {
    const hidePaths = [
      '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email',
      '/about', '/terms', '/contact-us', '/cancellation-and-refunds', '/checkout',
      '/test/', '/take', '/result', '/live-class', '/invoice'
    ];
    const isHiddenPage = Boolean(currentUrl && hidePaths.some(p => currentUrl.includes(p)));

    // Hide native tab bar if it's a hidden page OR if video is fullscreen
    const tabBarStyle = (isHiddenPage || isFullscreen) ? { display: 'none' as const } : {
      backgroundColor: '#ffffff',
      borderTopColor: '#f1f5f9',
      borderTopWidth: 1,
      height: Platform.OS === 'ios' ? 85 : 65,
      paddingBottom: Platform.OS === 'ios' ? 25 : 10,
      paddingTop: 10,
    };

    navigation.setOptions({ tabBarStyle });
    navigation.getParent()?.setOptions({ tabBarStyle });
  }, [currentUrl, isFullscreen, navigation]);


  const onNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
    
    const url = navState.url;
    try {
      if (url && url.startsWith(BASE_URL)) {
        const pathname = url.replace(BASE_URL, '').split('?')[0];
        if (pathname === '/batches' && path !== '/batches') {
          navigation.navigate('Batches' as never);
        } else if (pathname === '/chats' && path !== '/chats') {
          navigation.navigate('Chats' as never);
        } else if (pathname === '/store' && path !== '/store') {
          navigation.navigate('Store' as never);
        } else if ((pathname === '/student' || pathname === '/admin' || pathname === '/dashboard') && path !== '/student' && path !== '/admin') {
          navigation.navigate('Dashboard' as never);
        } else if (pathname === '/' && path !== '/') {
          navigation.navigate('Home' as never);
        }
      }
    } catch(e) {}
  }, [navigation, path]);

  const onMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'FULLSCREEN') {
        handleFullscreen(data.value);
      } else if (data.type === 'PULL_TO_REFRESH') {
        if (webViewRef.current) {
          webViewRef.current.reload();
        }
      } else if (data.type === 'DOWNLOAD_PDF' || data.type === 'DOWNLOAD_FILE') {
        try {
          const { base64, filename, mimeType = 'application/pdf', dialogTitle = 'Download File' } = data;
          const fileUri = `${FileSystem.documentDirectory}${filename}`;
          const pureBase64 = base64.includes('base64,') ? base64.split('base64,')[1] : base64;
          
          await FileSystem.writeAsStringAsync(fileUri, pureBase64, {
            encoding: 'base64',
          });
          
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            let uti = 'public.data';
            if (mimeType.includes('pdf')) uti = 'com.adobe.pdf';
            else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) uti = 'public.jpeg';
            else if (mimeType.includes('png')) uti = 'public.png';

            await Sharing.shareAsync(fileUri, {
              mimeType: mimeType,
              dialogTitle: dialogTitle,
              UTI: uti,
            });
          } else {
            if (Platform.OS === 'android') {
              ToastAndroid.show('File saved internally, but sharing is not available', ToastAndroid.LONG);
            }
          }
        } catch (e: any) {
          if (Platform.OS === 'android') {
            ToastAndroid.show('Error saving file: ' + e.message, ToastAndroid.LONG);
          }
        }
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
        pullToRefreshEnabled={!isFullscreen}
        overScrollMode="always"
        nestedScrollEnabled={true}
        onLoadStart={(e) => onNavigationStateChange(e.nativeEvent)}
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
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        androidLayerType="hardware"
        incognito={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
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
        scalesPageToFit={false}
        userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.196 Mobile Safari/537.36 MishraClassesApp"
        injectedJavaScript={`
          (function() {
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
            document.getElementsByTagName('head')[0].appendChild(meta);
            
            const style = document.createElement('style');
            style.innerHTML = \`
              body { -webkit-user-select: none; user-select: none; }
              ::-webkit-scrollbar { display: none !important; }
              #web-bottom-nav { display: none !important; }
              @keyframes ptrSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            \`;
            document.head.appendChild(style);

            // Pull-To-Refresh Engine (Active on all main browsing screens including Chats list)
            if (!window._ptrInitialized) {
              window._ptrInitialized = true;
              let startY = 0;
              let currentPull = 0;
              let isPulling = false;
              let isRefreshing = false;
              const PULL_THRESHOLD = 75;

              function isPtrBlocked(target) {
                const path = window.location.pathname;
                
                // Block in live streaming or test taking
                if (
                  path.includes('/live-class') || 
                  path.includes('/studio') || 
                  path.includes('/take')
                ) {
                  return true;
                }

                // If inside an active open conversation (reading messages)
                if (document.querySelector('[data-chat-conversation="active"], [data-no-ptr="true"], #chat-message-list')) {
                  return true;
                }

                if (!target) return false;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return true;

                // If inner container is scrolled down
                let curr = target;
                while (curr && curr !== document.body && curr !== document.documentElement) {
                  if (curr.scrollTop > 2) {
                    return true;
                  }
                  if (curr.getAttribute && (curr.getAttribute('data-no-ptr') === 'true' || curr.getAttribute('data-chat-conversation') === 'active')) {
                    return true;
                  }
                  curr = curr.parentElement;
                }
                return false;
              }

              const ptrContainer = document.createElement('div');
              ptrContainer.id = 'app-pull-to-refresh';
              ptrContainer.style.cssText = 'position:fixed; top:-60px; left:50%; transform:translateX(-50%); z-index:999999; width:44px; height:44px; background:#ffffff; border-radius:50%; box-shadow:0 4px 18px rgba(0,0,0,0.18); display:flex; align-items:center; justify-content:center; transition:top 0.15s ease-out; pointer-events:none; border:1px solid #e2e8f0;';
              
              ptrContainer.innerHTML = '<svg id="ptr-icon" viewBox="0 0 24 24" width="22" height="22" stroke="#5B58FF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.1s linear;"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>';
              
              document.documentElement.appendChild(ptrContainer);
              const ptrIcon = document.getElementById('ptr-icon');

              function getScrollTop() {
                return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
              }

              window.addEventListener('touchstart', function(e) {
                if (isRefreshing) return;
                if (isPtrBlocked(e.target)) {
                  isPulling = false;
                  startY = 0;
                  return;
                }
                if (getScrollTop() <= 1) {
                  startY = e.touches[0].screenY;
                  isPulling = true;
                } else {
                  isPulling = false;
                  startY = 0;
                }
              }, { passive: true });

              window.addEventListener('touchmove', function(e) {
                if (!isPulling || isRefreshing) return;
                if (isPtrBlocked(e.target) || getScrollTop() > 1) {
                  isPulling = false;
                  ptrContainer.style.top = '-60px';
                  return;
                }

                const touchY = e.touches[0].screenY;
                const diff = touchY - startY;

                if (diff > 0) {
                  currentPull = Math.min(diff * 0.42, 100);
                  ptrContainer.style.top = (currentPull - 48) + 'px';
                  if (ptrIcon) {
                    ptrIcon.style.transform = 'rotate(' + (currentPull * 4) + 'deg)';
                  }
                }
              }, { passive: true });

              window.addEventListener('touchend', function() {
                if (!isPulling || isRefreshing) return;
                isPulling = false;

                if (currentPull >= PULL_THRESHOLD) {
                  isRefreshing = true;
                  ptrContainer.style.top = '16px';
                  if (ptrIcon) {
                    ptrIcon.style.animation = 'ptrSpin 0.7s linear infinite';
                  }

                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PULL_TO_REFRESH' }));
                  } else {
                    window.location.reload();
                  }

                  setTimeout(function() {
                    ptrContainer.style.top = '-60px';
                    if (ptrIcon) {
                      ptrIcon.style.animation = '';
                    }
                    isRefreshing = false;
                    currentPull = 0;
                  }, 1500);
                } else {
                  ptrContainer.style.top = '-60px';
                  currentPull = 0;
                }
              }, { passive: true });
            }
          })();
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
