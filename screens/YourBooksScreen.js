import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // useNavigation import removed as navigation prop is used
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../services/apiClient'; //
import { AuthContext } from '../navigation/AuthProvider'; //

const DEFAULT_COVER = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Cover';

export default function YourBooksScreen({ navigation }) { //
  const [current, setCurrent] = useState([]); 
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current'); 

  const insets = useSafeAreaInsets(); 
  const { token } = useContext(AuthContext); //

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
      // CORRECTED API ENDPOINT
      const response = await apiClient.get('/api/borrowings/'); //
      
      const allBorrowings = response.data;
      // Filtering logic based on your backend status choices for Borrowing model
      const currentBooks = allBorrowings.filter(
        item => ['REQUESTED', 'ACTIVE', 'OVERDUE', 'PENDING_RETURN'].includes(item.status)
      );
      const historyBooks = allBorrowings.filter(
        item => ['RETURNED', 'RETURNED_LATE', 'CANCELLED', 'REJECTED', 'LOST_BY_BORROWER'].includes(item.status)
      );
      setCurrent(currentBooks);
      setHistory(historyBooks);

    } catch (e) {
      console.error("Failed to fetch borrowed books:", e.response?.data || e.message);
      let errorMessage = 'Failed to load your books. Please try again.';
      if (e.response?.data?.detail) {
          errorMessage = e.response.data.detail;
      } else if (e.message) {
          errorMessage = e.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchBorrowedBooks();
    }, [fetchBorrowedBooks]) 
  );

  // Corrected navigation handler
  const handleItemPress = (borrowingItem) => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('BorrowDetail', { 
        borrowingId: borrowingItem.id,
        // bookTitle: borrowingItem.book_copy?.book?.title // Optional, if BorrowDetail needs it for header
      });
    } else {
      console.error("Navigation prop is not available or navigate is not a function.");
      Alert.alert("Navigation Error", "Could not open details.");
    }
  };

  const renderBookItem = ({ item }) => {
    // Using your existing renderBookItem structure and styles
    // console.log("Book Item for render: ", item); // Keep for debugging if you like
    const bookData = item.book_copy?.book;
    const coverImageUrl = bookData?.cover_image || DEFAULT_COVER;

    // Using correct date fields from backend and consistent formatting
    const formattedRequestDate = item.request_date ? new Date(item.request_date).toLocaleDateString() : 'N/A';
    const formattedDueDate = item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A';
    const formattedReturnDate = item.return_date ? new Date(item.return_date).toLocaleDateString() : 'N/A';

    return (
        <TouchableOpacity
            style={styles.card} // Your existing style
            onPress={() => handleItemPress(item)} // Corrected navigation call
        >
            <Image source={{ uri: coverImageUrl }} style={styles.cover} onError={(e) => console.log("Failed to load image:", e.nativeEvent.error)} />
            <View style={styles.bookDetails}>
                <Text style={styles.title} numberOfLines={2}>{bookData?.title || 'Unknown Title'}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                    by {bookData?.authors?.length > 0 ? bookData.authors.map(a => a.name).join(', ') : 'Unknown Author'}
                </Text>
                <Text style={styles.status}>Status: <Text style={styles.statusText(item.status)}>{item.status.replace('_', ' ')}</Text></Text>
                
                {/* Conditional Date Display - Adjusted to use correct fields */}
                {activeTab === 'current' && item.status === 'REQUESTED' && 
                    <Text style={styles.date}>Requested: {formattedRequestDate}</Text>}
                
                {activeTab === 'current' && (item.status === 'ACTIVE' || item.status === 'OVERDUE' || item.status === 'PENDING_RETURN') &&
                 <Text style={styles.date}>Due: {formattedDueDate}</Text>
                }

                {activeTab === 'history' && (item.status === 'RETURNED' || item.status === 'RETURNED_LATE') &&
                 <Text style={styles.date}>Returned: {formattedReturnDate}</Text>
                }
                {activeTab === 'history' && (item.status === 'CANCELLED' || item.status === 'REJECTED' || item.status === 'LOST_BY_BORROWER') &&
                 <Text style={styles.date}>Processed: {formattedRequestDate}</Text> // Using request date as a general processed date
                }

                {item.status === 'OVERDUE' && <Text style={styles.overdueBadge}>OVERDUE</Text>}
                
            </View>
        </TouchableOpacity>
    );
  };
  
  const activeData = activeTab === 'current' ? current : history;

  // Your existing JSX for header, tabs, error display, loader, and FlatList
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
             <Text style={styles.headerTitle}>Your Books</Text>
        </View>
        <View style={styles.tabs}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'current' && styles.activeTab]}
                onPress={() => setActiveTab('current')}
            >
                <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
                    Current ({current.length})
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

         {error && !loading && (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchBorrowedBooks} style={styles.retryButton}>
                     <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
         )}

        {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color="#4A90E2" />
        ) : (
            <FlatList
                data={activeData}
                keyExtractor={(item) => `borrow-${item.id.toString()}`} // Ensure key is a string
                renderItem={renderBookItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {activeTab === 'current'
                            ? 'You have no pending or currently borrowed books.'
                            : 'No borrowing history found.'}
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
            />
        )}
    </View>
  );
}

// YOUR EXISTING STYLES - These are preserved
const styles = StyleSheet.create({ //
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 15, 
      paddingBottom: 10,
      backgroundColor: '#fff', 
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#1a202c',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10, 
  },
  tab: {
    flex: 1,
    paddingVertical: 14, 
    alignItems: 'center',
    borderBottomWidth: 3, 
    borderBottomColor: 'transparent', 
  },
  activeTab: {
    borderBottomColor: '#4a90e2', 
  },
  tabText: {
    fontWeight: '600',
    color: '#64748b', 
    fontSize: 15,
  },
  activeTabText: {
    color: '#4a90e2', 
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
    width: 75, 
    height: 110,
    borderRadius: 8,
    backgroundColor: '#e0e0e0', 
    marginRight: 14,
  },
  bookDetails: {
      flex: 1, 
      justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16, 
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    color: '#666',
    fontSize: 14, 
    marginBottom: 6,
  },
  date: { // Style for all date displays in the item
    fontSize: 12,
    color: '#718096', 
    marginTop: 2,
    marginBottom: 4, // Added some bottom margin for dates
  },
  status: { // Container for "Status: <actual_status>"
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    marginBottom: 4, // Added margin
  },
  statusText: (status) => ({ // Your dynamic style function for status text color
    fontWeight: 'bold',
    textTransform: 'capitalize',
    color: status === 'ACTIVE' || status === 'pending' ? '#10B981' // 'pending' in your style, API uses 'REQUESTED' or 'ACTIVE'
         : status === 'REQUESTED' ? '#F59E0B' // Added for REQUESTED
         : status === 'RETURNED' || status === 'RETURNED_LATE' ? '#6B7280'
         : status === 'REJECTED' || status === 'CANCELLED' ? '#EF4444' 
         : status === 'OVERDUE' ? '#C53030' // Moved overdue color here from badge
         : '#4B5563', 
  }),
   overdueBadge: { // You can keep this if you want a separate badge for overdue
      backgroundColor: '#C53030',
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
      alignSelf: 'flex-start', 
  },
  errorContainer: { // Your style for error message area
    backgroundColor: '#fff0f0',
    padding: 15,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  errorText: {
      textAlign: 'center',
      color: '#d9534f', // Error text color
      fontSize: 14,
      marginBottom: 10,
  },
  retryButton: {
      backgroundColor: '#4a90e2',
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 6,
  },
  retryButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
  },
  loader: { // Your style for main loader
    marginTop: 50, // Give it some space
  },
  emptyContainer: { // Your style for empty list message
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  }
});