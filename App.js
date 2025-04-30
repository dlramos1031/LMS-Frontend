// App.js
import React, { useEffect, useState, useContext, useRef } from 'react'; // Import React
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext, AuthProvider } from './navigation/AuthProvider';
import RootNavigator from './navigation/RootNavigator';
import * as Notifications from 'expo-notifications';
// Import the CLEANED utility function
import registerForPushNotificationsAsync from './utils/registerForPushNotifications';
// Keep apiClient import for sending the token to the backend
import apiClient from './services/apiClient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for AsyncStorage to track if token sent for the current login session
const PUSH_TOKEN_SENT_KEY = '@push_token_sent_for_session';

// Inner component rendered within AuthProvider to access context
function InnerApp() {
  // Get the Django API authentication token from context
  const { token: authToken } = useContext(AuthContext);
  // State to store the obtained Expo Push Token
  const [expoPushToken, setExpoPushToken] = useState(null);
  // Optional: State to store the last received foreground notification
  const [notification, setNotification] = useState(null);
  // Refs to keep track of notification listeners for cleanup
  const notificationListener = useRef();
  const responseListener = useRef();

  // --- Effect 1: Runs ONCE on component mount ---
  // Purpose: Register for push notifications (get token) and set up listeners.
  useEffect(() => {
    console.log('App.js: Mount effect - registering for push notifications and setting listeners...');

    // Call the utility function to get the token
    registerForPushNotificationsAsync()
      .then(token => {
        // If token is successfully obtained, store it in local state
        if (token) {
          console.log('App.js: Setting Expo Push Token state:', token);
          setExpoPushToken(token);
        } else {
          console.log('App.js: Could not get Expo Push Token from util (permissions denied or error).');
          // Handle failure to get token if needed (e.g., show a non-blocking message)
        }
      })
      .catch(error => {
        // Catch potential errors from the promise itself (less likely with try/catch in util)
        console.error("App.js: Error calling registerForPushNotificationsAsync promise:", error);
      });

    // Listener: Fires when a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('App.js: Notification received while foregrounded:', notification);
      setNotification(notification); // Update state with the notification object
      // Optional: Show an in-app banner or update UI based on the notification
    });

    // Listener: Fires when a user taps on a notification (app opens or comes to foreground)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('App.js: Notification tapped by user:', response);
      // Optional: Handle navigation or actions based on notification content
      // const { data } = response.notification.request.content;
      // if (data?.screen) { navigation.navigate(data.screen); } // Example navigation
    });

    // Cleanup function: Remove listeners when the component unmounts
    return () => {
      console.log('App.js: Unmount effect - removing notification listeners.');
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // --- Effect 2: Runs when expoPushToken or authToken changes ---
  // Purpose: Send the obtained Expo Push Token to the backend *after* the user logs in.
  useEffect(() => {
    console.log(`App.js: Send token effect triggered - expoPushToken: ${!!expoPushToken}, authToken: ${!!authToken}`);

    // Function to perform the API call
    const sendTokenToBackend = async (pushToken, apiToken) => {
      try {
        // Check AsyncStorage to see if we already sent the token for this specific login session
        const alreadySentSessionToken = await AsyncStorage.getItem(PUSH_TOKEN_SENT_KEY);
        // Compare against the current auth token to ensure it's for *this* login
        if (alreadySentSessionToken === apiToken) {
          console.log('App.js: Push token already sent to backend for this login session. Skipping.');
          return; // Don't send again for this session
        }

        console.log('App.js: Attempting to send Expo Push Token to backend...');

        // *** VERIFY THIS ENDPOINT PATH IS CORRECT ***
        // It should be the full path relative to your apiClient's baseURL.
        // If baseURL is 'http://IP:PORT', endpoint should likely start with '/api/'
        const endpoint = '/auth/device/register/'; // Make sure this matches your Django URL

        console.log(`App.js: Sending POST to ${endpoint}`);
        // Make the API call using apiClient
        await apiClient.post(endpoint, {
          device_token: pushToken // Use the key expected by the backend
        });

        console.log('App.js: Expo Push Token sent successfully to backend.');
        // Mark as sent for this specific login session by storing the auth token used
        await AsyncStorage.setItem(PUSH_TOKEN_SENT_KEY, apiToken);

      } catch (error) {
        // Log detailed error information
        console.error('App.js: Failed to send Expo Push Token to backend.');
        if (error.response) {
          // Error response from the server (e.g., 4xx, 5xx)
          console.error('Backend Status:', error.response.status);
          console.error('Backend Response Data:', error.response.data);
        } else if (error.request) {
          // Request was made but no response received (network error)
          console.error('Network Error or No Response:', error.request);
        } else {
          // Other errors (e.g., setting up the request)
          console.error('Request Setup Error:', error.message);
        }
        // Optionally alert the user about the failure
         alert('Could not register your device for notifications with the server. Please try again later.');
      }
    };

    // --- Trigger Condition ---
    // Only attempt to send if we have BOTH the Expo token AND the user's auth token
    if (expoPushToken && authToken) {
      console.log('App.js: Both Expo token and Auth token are present. Calling sendTokenToBackend.');
      sendTokenToBackend(expoPushToken, authToken);
    } else {
       console.log(`App.js: Conditions not met for sending token - Expo Token Present: ${!!expoPushToken}, Auth Token Present: ${!!authToken}`);
    }
    // -----------------------

  }, [expoPushToken, authToken]); // Dependencies: Re-run this effect if either token changes

  // --- Effect 3: Runs when authToken changes ---
  // Purpose: Clear the "token sent" flag when the user logs out (authToken becomes null).
  useEffect(() => {
    if (!authToken) {
      // User has logged out (or was never logged in)
      console.log('App.js: Auth token is null/undefined. Clearing push token sent flag.');
      // Remove the flag from AsyncStorage so it can be sent again on next login
      AsyncStorage.removeItem(PUSH_TOKEN_SENT_KEY);
    }
  }, [authToken]); // Dependency: Run when authToken changes

  // Render the main navigation structure
  return <RootNavigator />; // RootNavigator likely handles switching between AuthStack and MainStack
}

// Main App component providing context and navigation container
export default function App() {
  return (
    // Provides safe area insets
    <SafeAreaProvider>
      {/* Provides authentication state (token, login, logout) */}
      <AuthProvider>
        {/* Provides navigation context */}
        <NavigationContainer>
          {/* Renders the inner app logic */}
          <InnerApp />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
