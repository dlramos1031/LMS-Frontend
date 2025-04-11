import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './navigation/AuthProvider';
import RootNavigator from './navigation/RootNavigator';
import * as Notifications from 'expo-notifications';
import registerForPushNotificationsAsync from './utils/registerForPushNotifications';

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('Push token:', token);
      }
    });

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}
