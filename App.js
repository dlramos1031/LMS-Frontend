import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './navigation/AuthProvider';
import RootNavigator from './navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import registerForPushNotificationsAsync from './utils/registerForPushNotifications';

export default function App() {
  useEffect(() => {
    // Register for push notifications
    const registerPushNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log('Push token:', token);
      }
    };

    registerPushNotifications();

    // Listener for notification receipt
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Handle notification here, e.g., display an alert or update app state
    });

    // Cleanup: remove notification listener when the component unmounts
    return () => {
      notificationSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
