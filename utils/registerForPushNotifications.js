// utils/registerForPushNotifications.js
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device'; // Import Device module

// Configure notification handling (optional but recommended for foreground behavior)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show alert even if app is foreground
    shouldPlaySound: false, // No sound
    shouldSetBadge: false, // Don't change app badge count
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
     // Optionally alert the user, but console warning is often sufficient for dev
     // alert('Push notifications are only available on physical devices.');
     return null; // Return null if not a physical device
  }

  try {
    // --- Step 1: Request Permissions (Crucial for iOS) ---
    console.log('Checking notification permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If permissions not granted, ask the user
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If permissions are still not granted after asking, exit.
    if (finalStatus !== 'granted') {
      alert('Failed to get push token! Notification permissions were not granted.');
      console.warn(`Notification permissions status: ${finalStatus}`);
      return null; // Return null if permissions denied
    }
    console.log('Notification permissions granted.');
    // ---------------------------------------------------------

    // --- Step 2: Get Expo Push Token ---
    console.log('Getting Expo Push Token...');
    // Retrieves the token associated with the device/app installation
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    token = tokenResponse.data; // The actual token string
    console.log('Obtained Expo Push Token:', token);
    // ------------------------------------

     // --- Step 3: Configure Android Notification Channel (Optional but Recommended) ---
     // Ensures notifications work correctly on Android 8.0+
     if (Platform.OS === 'android') {
        console.log('Setting Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
           name: 'default', // Channel ID
           importance: Notifications.AndroidImportance.MAX, // High importance
           vibrationPattern: [0, 250, 250, 250], // Vibration pattern
           lightColor: '#FF231F7C', // Optional: LED color
        });
        console.log('Android notification channel set.');
     }
     // ---------------------------------------------------------------------------

  } catch (error) {
      // Catch any unexpected errors during the process
      console.error('Error during push notification registration process:', error);
      alert(`An error occurred while setting up notifications: ${error.message}`);
      token = null; // Ensure token is null on error
  }

  // Return the obtained token (string) or null if any step failed
  return token;
};

// Export the function as the default export
export default registerForPushNotificationsAsync;
