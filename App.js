import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, ActivityIndicator, BackHandler, StatusBar, Alert, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

function MainWebScreen() {
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false); // NEW: Track network errors

  const injectedJS = `
    window.alert = function(message) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'alert', message: message }));
    };
    true; 
  `;

  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true; 
      }
      return false;
    };

    const backHandlerSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandlerSubscription.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {!hasError ? (
        <WebView 
          ref={webviewRef}
          source={{ uri: 'https://uemfood.netlify.app/' }} 
          
          // NEW: Spoof a standard Chrome mobile browser to bypass Netlify bot protection
          userAgent="Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36"
          
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          
          // NEW: Catch the ERR_CONNECTION_CLOSED error gracefully
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setLoading(false);
            setHasError(true);
          }}

          injectedJavaScript={injectedJS}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'alert') {
                Alert.alert(
                  "foodHub", 
                  data.message,
                  [{ text: "OK" }]
                );
              }
            } catch (error) {
              // Fails silently
            }
          }}

          androidLayerType="hardware" 
          domStorageEnabled={true}
          javaScriptEnabled={true}
          style={{ flex: 1 }}
        />
      ) : (
        // NEW: Show a friendly error screen instead of a blank page
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not connect to the server.</Text>
          <Text style={styles.errorSubText}>Please check your internet connection and try again.</Text>
        </View>
      )}
      
      {loading && !hasError && (
        <ActivityIndicator 
          size="large" 
          color="#ff6600" 
          style={styles.loader} 
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainWebScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: StatusBar.currentHeight || 0,
    backgroundColor: '#fff' 
  },
  loader: { 
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    marginLeft: -20, 
    marginTop: -20 
  },
  // NEW styles for the error screen
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  }
});