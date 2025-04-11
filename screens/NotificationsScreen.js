import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { auth, db } from '../config/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read: true,
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const clearAll = async () => {
    Alert.alert('Clear All?', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            for (const item of notifications) {
              await deleteDoc(doc(db, 'notifications', item.id));
            }
            fetchNotifications();
          } catch (err) {
            console.error('Error clearing notifications:', err);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'reminder':
        return 'notifications-outline';
      case 'overdue':
        return 'alert-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, item.read ? styles.readCard : styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
    >
      <Ionicons
        name={getIcon(item.type)}
        size={24}
        color={item.read ? '#aaa' : '#4a90e2'}
        style={styles.icon}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, item.read && { color: '#555' }]}>
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>
          {moment(item.createdAt?.toDate()).fromNow()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={clearAll}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 50 },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#f7f9fc',
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#e6f0ff',
  },
  readCard: {
    backgroundColor: '#f2f2f2',
  },
  icon: {
    marginRight: 12,
    marginTop: 3,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111',
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  clearText: {
    color: '#d9534f',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 50,
  },
});
