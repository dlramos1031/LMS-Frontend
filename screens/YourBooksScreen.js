import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../services/apiClient'; 
import { AuthContext } from '../navigation/AuthProvider'; 

const DEFAULT_COVER = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Cover';

export default function YourBooksScreen() {
  const [current, setCurrent] = useState([]); 
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current'); 
  const [cancellingBookId, setCancellingBookId] = useState(null); 

  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); 
  const { token } = useContext(AuthContext); 

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
      const response = await apiClient.get('/api/borrowings/'); 
      const allBorrowed = response.data || [];
      const currentBorrowed = [];
      const pastBorrowed = [];

      const currentStatuses = ['REQUESTED', 'ACTIVE', 'OVERDUE']; 
      const mapToBackendStatus = (frontendStatus) => {
        if (frontendStatus === 'pending') return 'REQUESTED';
        if (frontendStatus === 'approved') return 'ACTIVE'; 
        return frontendStatus; 
      };

      allBorrowed.forEach((item) => {
        const backendStatus = item.status;
        if (currentStatuses.includes(backendStatus)) {
            currentBorrowed.push(item);
        } else {
            pastBorrowed.push(item);
        }
      });

      setCurrent(currentBorrowed);
      setHistory(pastBorrowed);

    } catch (err) {
      console.error('Error fetching borrowed books:', err.response?.data || err.message);
      setError("Failed to load borrowed books. Please try again.");
      setCurrent([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [token]); 

  useFocusEffect(
    useCallback(() => {
      fetchBorrowedBooks();
    }, [fetchBorrowedBooks]) 
  );

  const cancelBorrowRequest = async (borrowingId) => {
    if (!borrowingId) return;

    // Confirm cancel request
    Alert.alert(
        "Cancel Request",
        "Are you sure you want to cancel this borrow request?",
        [
            { text: "No", style: "cancel" },
            {
                text: "Yes",
                onPress: async () => {
                    setCancellingBookId(borrowingId);
                    setError(null);
                    try {
                        await apiClient.delete(`/api/borrow/${borrowingId}/cancel-request/`);
                        Alert.alert('Success', 'Borrow request cancelled successfully.');
                        fetchBorrowedBooks(); 
                    } catch (error) {
                        console.error('Error cancelling borrow request:', error.response?.data || error.message);
                        let errorMessage = 'Could not cancel request.';
                        if (error.response?.data?.detail) errorMessage = error.response.data.detail;
                        else if (error.response?.data?.error) errorMessage = error.response.data.error;
                        setError(errorMessage); 
                        Alert.alert('Cancellation Failed', errorMessage);
                    } finally {
                        setCancellingBookId(null); 
                    }
                },
                style: "destructive",
            },
        ]
    );
  };

  const renderBookItem = ({ item }) => {
    const bookData = item.book_copy?.book;
    const coverImageUrl = bookData?.cover_image || DEFAULT_COVER;

    const formattedBorrowDate = item.borrow_date ? new Date(item.borrow_date).toLocaleDateString() : 'N/A';
    const formattedDueDate = item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A';
    const formattedActualReturnDate = item.actual_return_date ? new Date(item.actual_return_date).toLocaleDateString() : 'N/A';

    const showCancelButton = item.status === 'pending';
    const isCurrentlyCancelling = cancellingBookId === item.id;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BookDetailsScreen', { book: bookData })}
            
        >
            <Image source={{ uri: coverImageUrl }} style={styles.cover} onError={(e) => console.log("Failed to load image:", e.nativeEvent.error)} />
            <View style={styles.bookDetails}>
                <Text style={styles.title} numberOfLines={2}>{bookData?.title || 'Unknown Title'}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                    by {bookData?.authors?.length > 0 ? bookData.authors.map(a => a.name).join(', ') : 'Unknown Author'}
                </Text>
                <Text style={styles.status}>Status: <Text style={styles.statusText(item.status)}>{item.status}</Text></Text>
                <Text style={styles.date}>Requested: {formattedBorrowDate}</Text>

                {(item.status === 'pending' || item.status === 'approved') && !item.actual_return_date &&
                 <Text style={styles.date}>Due: {formattedDueDate}</Text>
                }
                {item.status === 'returned' && item.actual_return_date &&
                 <Text style={styles.date}>Returned: {formattedActualReturnDate}</Text>
                }
                {item.is_overdue && <Text style={styles.overdueBadge}>OVERDUE</Text>}
                
                {/* Cancel Button */}
                {showCancelButton && (
                    <TouchableOpacity
                        style={[styles.cancelButton, isCurrentlyCancelling && styles.buttonDisabled]}
                        onPress={() => cancelBorrowRequest(item.id)} 
                        disabled={isCurrentlyCancelling}
                    >
                        {isCurrentlyCancelling ? (
                            <ActivityIndicator size="small" color="#DC2626" /> 
                        ) : (
                            <Text style={styles.cancelButtonText}>Cancel Request</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
  };
  
  const activeData = activeTab === 'current' ? current : history;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={styles.header}>
             <Text style={styles.headerTitle}>Your Books</Text>
        </View>

        {/* Tabs for Current/History */}
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

         {/* Error Display Area */}
         {error && !loading && (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchBorrowedBooks} style={styles.retryButton}>
                     <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
         )}

        {/* Loading Indicator or Book List */}
        {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color="#4A90E2" />
        ) : (
            <FlatList
                data={activeData}
                keyExtractor={(item) => `borrow-${item.id}`}
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
  clearText: {
    color: '#d9534f', 
    fontWeight: '600',
    fontSize: 14,
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
  date: {
    fontSize: 12,
    color: '#718096', 
    marginTop: 2,
  },
  statusText: (status) => ({ 
    fontWeight: 'bold',
    textTransform: 'capitalize',
    color: status === 'approved' ? '#10B981' 
         : status === 'pending' ? '#F59E0B' 
         : status === 'returned' ? '#6B7280'
         : status === 'rejected' ? '#EF4444' 
         : '#4B5563', 
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
      alignSelf: 'flex-start', 
  },
  button: {
    marginTop: 10,
    backgroundColor: '#4a90e2',
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
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#E53E3E', 
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
  buttonDisabled: { 
    opacity: 0.6, 
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