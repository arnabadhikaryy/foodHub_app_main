import React, { useState, useRef, useEffect } from 'react';
// NEW: Import 'Alert' from react-native
import { StyleSheet, ActivityIndicator, BackHandler, StatusBar, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

function MainWebScreen() {
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  // NEW: This JavaScript gets injected into the website when it loads
  const injectedJS = `
    window.alert = function(message) {
      // Instead of showing the default browser alert, send the text to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'alert', message: message }));
    };
    true; // Required so the injection doesn't crash
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
      
      <WebView 
        ref={webviewRef}
        source={{ uri: 'https://uemfood.netlify.app/' }} 
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        
        // NEW: Add the injected script
        injectedJavaScript={injectedJS}
        
        // NEW: Listen for messages sent from the injected script
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'alert') {
              // Display a clean, native React Native alert
              Alert.alert(
                "foodHub", // You can change this title to your App Name like "UEM Food"
                data.message,
                [{ text: "OK" }]
              );
            }
          } catch (error) {
            // Fails silently if the message isn't JSON (prevents app crashes)
          }
        }}

        androidLayerType="hardware" 
        domStorageEnabled={true}
        javaScriptEnabled={true}
        style={{ flex: 1 }}
      />
      
      {loading && (
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
  }
});