// Frontend/screens/NotificationsScreen.js
import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Removed: Firebase imports (auth, db, collection, query, where, orderBy, getDocs, updateDoc, doc, deleteDoc)
import apiClient from '../services/apiClient'; // Import apiClient
import { AuthContext } from '../navigation/AuthProvider'; // Import AuthContext
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment'; // Keep moment for date formatting

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const insets = useSafeAreaInsets();
  const { token } = useContext(AuthContext); // Get token to ensure user is logged in

  // Fetch Notifications from API
  const fetchNotifications = useCallback(async () => {
     if (!token) {
        setLoading(false);
        setError("Please log in to view notifications.");
        setNotifications([]);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching notifications from /api/notifications/");
      const response = await apiClient.get('/api/notifications/'); // GET request to list notifications
      setNotifications(response.data?.results || response.data || []); // Handle pagination if present
      console.log(`Fetched ${response.data?.results?.length || response.data?.length || 0} notifications`);
    } catch (err) {
      console.error('Error fetching notifications:', err.response || err);
      setError('Failed to load notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]); // Re-fetch if token changes

  // Refetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Mark a single notification as read
  const markAsRead = async (id) => {
    if (!id) return;

     // Find the notification in the current state to update UI optimistically
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1 || notifications[notificationIndex].read) {
        return; // Already read or not found
    }

     // Optimistically update UI
     const originalNotifications = [...notifications];
     const updatedNotifications = [...notifications];
     updatedNotifications[notificationIndex] = { ...updatedNotifications[notificationIndex], read: true };
     setNotifications(updatedNotifications);


    try {
        console.log(`Attempting POST to /notifications/${id}/mark_read/`);
      // Call the backend API endpoint
      await apiClient.post(`/api/notifications/${id}/mark_read/`);
      // No need to refetch if optimistic update is sufficient,
      // but you could refetch here if needed: fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error.response?.data || error);
       // Revert optimistic update on error
       setNotifications(originalNotifications);
      Alert.alert('Error', 'Could not mark notification as read.');
    }
  };

  // Clear all notifications (using the API endpoint)
  const clearAll = async () => {
    Alert.alert('Clear All?', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          setLoading(true); // Show loading indicator
          setError(null);
          const originalNotifications = [...notifications]; // Store for potential revert
          setNotifications([]); // Optimistic UI update

          try {
            console.log("Attempting DELETE to /notifications/clear_all/");
            await apiClient.delete('/api/notifications/clear_all/');
             // fetchNotifications(); // Or just confirm empty state
             console.log("Notifications cleared successfully");
          } catch (err) {
            console.error('Error clearing notifications:', err.response?.data || err);
            setNotifications(originalNotifications); // Revert optimistic update
            setError('Failed to clear notifications.');
            Alert.alert('Error', 'Could not clear notifications.');
          } finally {
              setLoading(false);
          }
        },
      },
    ]);
  };

  // Use a default icon for now, as 'type' wasn't explicitly added to backend
  const getIcon = (read) => {
     return read ? 'mail-open-outline' : 'mail-unread-outline'; // Example icons
  };

  const renderItem = ({ item }) => (
    // Mark as read on press
    <TouchableOpacity
      style={[styles.card, item.read ? styles.readCard : styles.unreadCard]}
      onPress={() => !item.read && markAsRead(item.id)} // Only mark if unread
      disabled={item.read} // Disable press if already read
    >
      <Ionicons
        name={getIcon(item.read)}
        size={24}
        color={item.read ? '#aaa' : '#4a90e2'}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Text style={[styles.title, item.read && styles.readText]}>
          {item.title || 'Notification'}
        </Text>
        <Text style={[styles.message, item.read && styles.readText]}>{item.message || ''}</Text>
        <Text style={styles.time}>
          {item.created_at ? moment(item.created_at).fromNow() : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Notifications</Text>
        {/* Show Clear All only if there are notifications and not loading */}
        {(notifications.length > 0 && !loading) && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

       {/* Error Display */}
      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {/* Loading Indicator or List */}
      {loading ? (
           <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4a90e2"/>
      ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listPadding}
            ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
            showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// Styles (minor adjustments possible)
const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#f8fafc', // Match other screens
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  clearText: {
    color: '#d9534f',
    fontWeight: '600',
    fontSize: 14,
  },
  listPadding: {
      padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon top
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unreadCard: {
    backgroundColor: '#fff', // Use white for unread
    // borderColor: '#4a90e2', // Optional: highlight border
  },
  readCard: {
    backgroundColor: '#f1f5f9', // Slightly off-white/gray for read
    opacity: 0.8, // Make read items slightly faded
  },
  icon: {
    marginRight: 12,
    marginTop: 2, // Align icon nicely with text
  },
  content: {
      flex: 1, // Take remaining space
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1a202c', // Darker title
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#4a5568', // Normal message color
    marginVertical: 4,
    lineHeight: 20,
  },
   readText: { // Style for read item text
      color: '#718096', // Lighter text color when read
   },
  time: {
    fontSize: 12,
    color: '#a0aec0', // Lighter time color
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: '#718096', // Adjusted empty text color
    marginTop: 50,
    fontSize: 16,
  },
   errorText: {
      textAlign: 'center',
      color: 'red',
      marginVertical: 10,
      paddingHorizontal: 16,
  },
});