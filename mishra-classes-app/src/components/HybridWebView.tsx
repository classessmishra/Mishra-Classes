import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

// Replace this with the user's production URL or local network IP for testing
export const BASE_URL = 'https://mishra-classes.vercel.app';

interface HybridWebViewProps {
  path: string;
}

export default function HybridWebView({ path }: HybridWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation();
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle hardware back button for Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false; // Let the default back navigation happen (exits app if at root)
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [canGoBack])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#5B58FF" />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ uri: `${BASE_URL}${path}` }}
        style={styles.webview}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          
          // Hide native bottom tabs if on auth pages
          const isAuthPage = navState.url.includes('/login') || navState.url.includes('/signup') || navState.url.includes('/forgot-password');
          navigation.setOptions({
            tabBarStyle: isAuthPage 
              ? { display: 'none' } 
              : { height: 60, paddingBottom: 10, paddingTop: 5, display: 'flex' }
          });
        }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
        onHttpError={() => setIsLoading(false)}
        renderError={(errorDomain, errorCode, errorDesc) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'red', textAlign: 'center', padding: 20 }}>
              Website se connect nahi ho paaya. 
              Kripya check karein ki aapka Next.js server chal raha hai ya nahi.
              Error: {errorDesc}
            </Text>
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        bounces={false}
        overScrollMode="never"
        scalesPageToFit={false}
        userAgent="MishraClassesApp/1.0"
        // Injected JS to hide web headers/footers, prevent zoom, and disable text selection except on inputs
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('name', 'viewport');
          meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
          document.getElementsByTagName('head')[0].appendChild(meta);
          
          document.body.style.userSelect = 'none';
          document.body.style.webkitUserSelect = 'none';
          
          // Inject native-like CSS
          const style = document.createElement('style');
          style.innerHTML = \`
            /* Hide the web bottom nav now that we added the ID */
            #web-bottom-nav { display: none !important; }
            
            /* Hide all scrollbars */
            ::-webkit-scrollbar {
              display: none !important;
            }
          \`;
          document.head.appendChild(style);
          true;
        `}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B58FF', // Matches Navbar color
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff80',
  },
});
