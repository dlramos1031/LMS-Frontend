import React, { useEffect, useState, useContext, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext, AuthProvider } from './navigation/AuthProvider';
import RootNavigator from './navigation/RootNavigator';
import * as Notifications from 'expo-notifications';
import registerForPushNotificationsAsync from './utils/registerForPushNotifications';
import apiClient from './services/apiClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

// Key for AsyncStorage to track if token sent for the current login session
const PUSH_TOKEN_SENT_KEY = '@push_token_sent_for_session';

// Inner component rendered within AuthProvider to access context
function InnerApp() {
  const { token: authToken } = useContext(AuthContext);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Register for push notifications (get token) and set up listeners.
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setExpoPushToken(token);
        } else {
          console.warn('App.js: Could not get Expo Push Token from util (permissions denied or error).');
        }
      })
      .catch(error => {
        console.error("App.js: Error calling registerForPushNotificationsAsync promise:", error);
      });

    // Listener: Fires when a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Cleanup function: Remove listeners when the component unmounts
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []); 
  
  useEffect(() => {
    const sendTokenToBackend = async (pushToken, apiToken) => {
      try {
        const alreadySentSessionToken = await AsyncStorage.getItem(PUSH_TOKEN_SENT_KEY);
        if (alreadySentSessionToken === apiToken) {
          return; 
        }

        const endpoint = '/auth/device/register/';

        await apiClient.post(endpoint, {
          device_token: pushToken 
        });
        await AsyncStorage.setItem(PUSH_TOKEN_SENT_KEY, apiToken);
      } catch (error) {
        console.error('App.js: Failed to send Expo Push Token to backend.');
        if (error.response) {
          console.error('Backend Status:', error.response.status);
          console.error('Backend Response Data:', error.response.data);
        } else if (error.request) {
          console.error('Network Error or No Response:', error.request);
        } else {
          console.error('Request Setup Error:', error.message);
        }
        alert('Could not register your device for notifications with the server. Please try again later.');
      }
    };

    // --- Trigger Condition ---
    if (expoPushToken && authToken) {
      sendTokenToBackend(expoPushToken, authToken);
    } else {
       console.warn(`App.js: Conditions not met for sending token - Expo Token Present: ${!!expoPushToken}, Auth Token Present: ${!!authToken}`);
    }
  }, [expoPushToken, authToken]);

  useEffect(() => {
    if (!authToken) {
      AsyncStorage.removeItem(PUSH_TOKEN_SENT_KEY);
    }
  }, [authToken]); 
  return <RootNavigator />; 
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <InnerApp />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
