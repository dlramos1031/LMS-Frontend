// Frontend/screens/YourBooksScreen.js
import React, { useEffect, useState, useCallback, useContext } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Removed: Firebase imports
// Removed: import { auth, db } from '../config/firebase';
// Removed: Firestore functions
import apiClient from '../services/apiClient'; // Import apiClient
import { AuthContext } from '../navigation/AuthProvider'; // Import AuthContext

// Default image if book cover is missing
const DEFAULT_COVER = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Cover';

export default function YourBooksScreen() {
  const [current, setCurrent] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'history'
  const [returningBookId, setReturningBookId] = useState(null); // State to show spinner on specific button
  const [cancellingBookId, setCancellingBookId] = useState(null);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { token } = useContext(AuthContext); // Check if user is logged in

  // Fetch Borrowed Books from API
  const fetchBorrowedBooks = useCallback(async () => {
    if (!token) {
        setLoading(false);
        setError("Please log in to view your books.");
        setCurrent([]);
        setHistory([]);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching borrowed books from /api/borrow/");
      const response = await apiClient.get('/borrow/'); // GET request to list user's borrowings
      const allBorrowed = response.data || []; // API returns a list

      const currentBorrowed = [];
      const pastBorrowed = [];

      allBorrowed.forEach((item) => {
        if ((item.status === 'approved' || item.status === 'pending') && item.is_active) {
            currentBorrowed.push(item);
        } else {
            pastBorrowed.push(item);
        }
      });

      setCurrent(currentBorrowed);
      setHistory(pastBorrowed);
      console.log("Fetched current:", currentBorrowed.length, "Fetched history:", pastBorrowed.length);

    } catch (err) {
      console.error('Error fetching borrowed books:', err.response || err);
      setError("Failed to load borrowed books.");
      setCurrent([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [token]); // Re-fetch if token changes

  // Refetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBorrowedBooks();
    }, [fetchBorrowedBooks])
  );

  const cancelBorrow = async (borrowingId) => {
    if (!borrowingId) return;
    setCancellingBookId(borrowingId); // Show loading on specific button
    setError(null);
    try {
        console.log(`Attempting DELETE to /borrow/${borrowingId}/cancel_request/`);
        // Call the new backend action using DELETE
        await apiClient.delete(`/borrow/${borrowingId}/cancel_request/`);
        Alert.alert('Success', 'Borrow request cancelled.');
        fetchBorrowedBooks(); // Refresh the lists (item should disappear from 'current')
    } catch (error) {
        console.error('Error cancelling borrow request:', error.response?.data || error);
        let errorMessage = 'Could not cancel request.';
        if (error.response?.data?.detail) errorMessage = error.response.data.detail;
        else if (error.response?.data?.error) errorMessage = error.response.data.error;
        setError(errorMessage); // Show error specific to this action
        Alert.alert('Cancellation Failed', errorMessage);
    } finally {
        setCancellingBookId(null); // Hide loading on specific button
    }
  };

  // Render Item Function
  const renderBook = ({ item }) => {
    // Data comes from enhanced BorrowingSerializer including nested book
    const bookData = item.book;
    const coverImageUrl = bookData?.cover_image || DEFAULT_COVER;
    const formattedBorrowDate = item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : 'N/A';
    const formattedReturnDate = item.return_date ? new Date(item.return_date).toLocaleDateString() : 'N/A';
    const showCancelButton = item.status === 'pending';
    const isCurrentlyCancelling = cancellingBookId === item.id;

    return (
        <View style={styles.card}>
        <Image source={{ uri: coverImageUrl }} style={styles.cover} />
        <View style={styles.bookDetails}>
            <Text style={styles.title} numberOfLines={2}>{bookData?.title || 'Unknown Title'}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
                by {bookData?.authors?.length > 0 ? bookData.authors[0].name : 'Unknown Author'}
            </Text>
            <Text style={styles.date}>Status: <Text style={styles.statusText(item.status)}>{item.status}</Text></Text>
            <Text style={styles.date}>Requested: {formattedBorrowDate}</Text>
            {(item.status === 'approved' || item.status === 'pending') && item.is_active &&
             <Text style={styles.date}>Due: {formattedReturnDate}</Text>
            }
            {(item.status === 'returned') &&
             <Text style={styles.date}>Returned: {formattedReturnDate}</Text>
            }
            {item.is_overdue && <Text style={styles.overdueBadge}>OVERDUE</Text>}

            {showCancelButton && (
            <TouchableOpacity
                style={[styles.cancelButton, isCurrentlyCancelling && styles.buttonDisabled]}
                onPress={() => cancelBorrow(item.id)} // Pass borrowing ID
                disabled={isCurrentlyCancelling}
            >
                {isCurrentlyCancelling ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                )}
            </TouchableOpacity>
            )}
        </View>
        </View>
    );
  };


  // Determine which data list to show based on the active tab
  const activeData = activeTab === 'current' ? current : history;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Custom Header might be better than a back button */}
        <View style={styles.header}>
             <Text style={styles.headerTitle}>Your Books</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
            <TouchableOpacity
            style={[styles.tab, activeTab === 'current' && styles.activeTab]}
            onPress={() => setActiveTab('current')}
            >
            <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
                Currently Borrowed ({current.length})
            </Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
            >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                History ({history.length})
            </Text>
            </TouchableOpacity>
        </View>

         {/* Error Display */}
         {error && !loading && <Text style={styles.errorText}>{error}</Text>}

        {/* Loading Indicator or List */}
        {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#4a90e2" />
        ) : (
            <FlatList
                data={activeData}
                keyExtractor={(item) => item.id.toString()} // Use borrowing ID as key
                renderItem={renderBook}
                ListEmptyComponent={
                <Text style={styles.empty}>
                    {activeTab === 'current'
                    ? 'No books currently borrowed.'
                    : 'No borrowing history.'}
                </Text>
                }
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
            />
        )}
    </View>
  );
}

// Updated Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 15, // Adjust as needed if header is custom
      paddingBottom: 10,
      backgroundColor: '#fff', // Optional header background
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1a202c',
  },
  clearText: {
    color: '#d9534f', // Keep clear button red
    fontWeight: '600',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    // Removed background color to make tabs distinct
    // backgroundColor: '#dde3eb',
    // borderRadius: 12, // Removed border radius
    // overflow: 'hidden', // Removed overflow
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10, // Space below tabs
  },
  tab: {
    flex: 1,
    paddingVertical: 14, // Increased padding
    alignItems: 'center',
    borderBottomWidth: 3, // Use border for active indicator
    borderBottomColor: 'transparent', // Default inactive border
  },
  activeTab: {
    borderBottomColor: '#4a90e2', // Active border color
  },
  tabText: {
    fontWeight: '600',
    color: '#64748b', // Inactive text color
    fontSize: 15,
  },
  activeTabText: {
    color: '#4a90e2', // Active text color
  },
  listPadding: {
      paddingHorizontal: 16,
      paddingBottom: 20,
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
    width: 75, // Slightly larger cover
    height: 110,
    borderRadius: 8,
    backgroundColor: '#e0e0e0', // Placeholder color
    marginRight: 14,
  },
  bookDetails: {
      flex: 1, // Allow text to take remaining space
      justifyContent: 'space-between', // Space out content vertically
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16, // Slightly smaller title
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    color: '#666',
    fontSize: 14, // Slightly larger subtitle
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: '#718096', // Slightly darker date color
    marginTop: 2,
  },
  statusText: (status) => ({ // Function to style status
    fontWeight: 'bold',
    textTransform: 'capitalize',
    color: status === 'approved' ? '#2F855A' : (status === 'pending' ? '#D69E2E' : (status === 'returned' ? '#4A5568' : '#C53030')), // Green for approved, Orange for pending, Gray for returned, Red for rejected
  }),
   overdueBadge: {
      backgroundColor: '#C53030',
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
      alignSelf: 'flex-start', // Align badge left
  },
  button: {
    marginTop: 10,
    backgroundColor: '#4a90e2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start', // Align button left
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 100, // Ensure button has some width for loader
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#E53E3E', // Red color for cancel/delete
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 100,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonDisabled: { // Generic disabled style
    opacity: 0.6, // Make it look faded
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  errorText: {
      textAlign: 'center',
      color: 'red',
      marginVertical: 10,
      paddingHorizontal: 16,
  },
});