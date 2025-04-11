import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export default function YourBooksScreen() {
  const [current, setCurrent] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const navigation = useNavigation();

  const fetchBorrowedBooks = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'borrowedBooks'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      const currentBorrowed = [];
      const pastBorrowed = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const bookSnap = await getDoc(doc(db, 'books', data.bookId));
        if (!bookSnap.exists()) continue;

        const bookData = {
          id: data.bookId,
          borrowedId: docSnap.id,
          ...bookSnap.data(),
          ...data,
        };

        if (data.returnedAt) {
          pastBorrowed.push(bookData);
        } else {
          currentBorrowed.push(bookData);
        }
      }

      setCurrent(currentBorrowed);
      setHistory(pastBorrowed);
    } catch (error) {
      console.error('Error fetching borrowed books:', error);
    } finally {
      setLoading(false);
    }
  };

  const returnBook = async (book) => {
    try {
      await updateDoc(doc(db, 'borrowedBooks', book.borrowedId), {
        returnedAt: new Date(),
      });
      await updateDoc(doc(db, 'books', book.id), {
        available: true,
      });
      fetchBorrowedBooks();
    } catch (error) {
      console.error('Error returning book:', error);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete your borrowing history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const item of history) {
                await deleteDoc(doc(db, 'borrowedBooks', item.borrowedId));
              }
              fetchBorrowedBooks();
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchBorrowedBooks();
  }, []);

  const renderBook = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.coverImage }} style={styles.cover} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.author}</Text>
        <Text style={styles.date}>Borrowed: {item.borrowedAt?.toDate().toDateString()}</Text>
        {item.returnedAt && (
          <Text style={styles.date}>Returned: {item.returnedAt.toDate().toDateString()}</Text>
        )}
        {!item.returnedAt && (
          <TouchableOpacity style={styles.button} onPress={() => returnBook(item)}>
            <Text style={styles.buttonText}>Return Book</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const activeData = activeTab === 'current' ? current : history;

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4a90e2" />;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Tabs', { screen: 'Home' })}
        style={styles.homeButton}
      >
        <Text style={styles.homeButtonText}>← Back to Home</Text>
      </TouchableOpacity>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            Currently Borrowed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeData}
        keyExtractor={(item) => item.borrowedId}
        renderItem={renderBook}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {activeTab === 'current'
              ? 'No books currently borrowed.'
              : 'No borrowing history yet.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      {activeTab === 'history' && history.length > 0 && (
        <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
          <Text style={styles.clearText}>Clear History</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    padding: 16,
    paddingTop: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  cover: {
    width: 70,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#333',
  },
  subtitle: {
    color: '#666',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#4a90e2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#888',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#dde3eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4a90e2',
  },
  tabText: {
    fontWeight: '600',
    color: '#444',
  },
  activeTabText: {
    color: '#fff',
  },
  clearButton: {
    backgroundColor: '#d9534f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  clearText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  homeButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  homeButtonText: {
    color: '#4a90e2',
    fontWeight: '600',
    fontSize: 16,
  },
});
