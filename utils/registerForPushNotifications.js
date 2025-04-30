import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, 
    shouldPlaySound: false, 
    shouldSetBadge: false, 
  }),
});

/**
 * Requests notification permissions and retrieves the Expo Push Token.
 * Handles platform differences and checks for physical devices.
 * @returns {Promise<string|null>} The Expo Push Token string, or null if failed.
 */
const registerForPushNotificationsAsync = async () => {
  let token = null;

  // Push notifications require a physical device, not an emulator/simulator
  if (!Device.isDevice) {
     console.warn('Push notifications require a physical device. Cannot get token on simulator/emulator.');
     return null; 
  }

  try {
    // --- Step 1: Request Permissions (Crucial for iOS) --------------------------
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permissions not granted, ask the user
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permissions are still not granted after asking, exit.
    if (finalStatus !== 'granted') {
      alert('Failed to get push token! Notification permissions were not granted.');
      console.warn(`Notification permissions status: ${finalStatus}`);
      return null;
    }
    // ----------------------------------------------------------------------------

    // --- Get Expo Push Token ----------------------------------------------------
    // Retrieves the token associated with the device/app installation
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    token = tokenResponse.data;
    // ----------------------------------------------------------------------------

    // --- Configure Android Notification Channel (Optional but Recommended) ------
    // Ensures notifications work correctly on Android 8.0+
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX, 
          vibrationPattern: [0, 250, 250, 250], 
          lightColor: '#FF231F7C', 
        });
    }
    // ----------------------------------------------------------------------------

  } catch (error) {
      console.error('Error during push notification registration process:', error);
      alert(`An error occurred while setting up notifications: ${error.message}`);
      token = null;
  }
  return token;
};

export default registerForPushNotificationsAsync;
