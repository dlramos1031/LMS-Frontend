// Frontend/screens/BookDetailsScreen.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView, 
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../navigation/AuthProvider'; 
import apiClient from '../services/apiClient'; 
import { Ionicons } from '@expo/vector-icons';

// Default image if book.cover_image is null/empty
const DEFAULT_COVER = 'https://via.placeholder.com/300/CCCCCC/FFFFFF?text=No+Cover';

export default function BookDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { token } = useContext(AuthContext);

  const { book: initialBookData } = route.params;

  const [book, setBook] = useState(initialBookData);
  const [isFavorite, setIsFavorite] = useState(initialBookData?.is_favorite || false);

  const [borrowingStatus, setBorrowingStatus] = useState(null); 
  const [borrowingId, setBorrowingId] = useState(null); 
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBorrowingStatus = useCallback(async () => {
    if (!token || !book?.id) {
        setBorrowingStatus('none'); // Assume not borrowed if not logged in or no book id
        setBorrowingId(null);
        setIsLoadingStatus(false);
        return;
    }
    setIsLoadingStatus(true);
    try {
        console.log(`Fetching borrowing status for book ID: ${book.id}`);
        // Fetch borrowing records for this specific book by the user
        const response = await apiClient.get('/borrow/', { params: { book_id: book.id } });
        const borrowings = response.data?.results || response.data || [];

        // Find the active or pending borrowing record for this book
        const activeOrPendingBorrow = borrowings.find(b => b.book.id === book.id && (b.status === 'approved' || b.status === 'pending') && b.is_active);

        if (activeOrPendingBorrow) {
            setBorrowingStatus(activeOrPendingBorrow.status); // 'approved' or 'pending'
            setBorrowingId(activeOrPendingBorrow.id);
             console.log(`Borrowing status: ${activeOrPendingBorrow.status}, ID: ${activeOrPendingBorrow.id}`);
        } else {
            setBorrowingStatus('none'); // Not currently borrowed or pending
            setBorrowingId(null);
             console.log('Borrowing status: none');
        }
    } catch (error) {
        console.error("Failed to fetch borrowing status:", error.response || error);
        setBorrowingStatus('error'); // Indicate an error occurred
        setBorrowingId(null);
    } finally {
        setIsLoadingStatus(false);
    }
  }, [token, book?.id]);

  useFocusEffect(
    useCallback(() => {
        setBook(initialBookData); // Reset book data from params on focus
        setIsFavorite(initialBookData?.is_favorite || false);
        fetchBorrowingStatus(); // Fetch current status
    }, [initialBookData, fetchBorrowingStatus])
  );

  // Handle Favorite Toggle
  const handleFavoriteToggle = async () => {
    if (!token) {
      Alert.alert("Login Required", "Please log in to add favorites.");
      return;
    }
    if (!book || !book.id) return; // Ensure book data is available

    setIsTogglingFavorite(true);
    const url = `/books/${book.id}/favorite/`;

    try {
      if (isFavorite) {
        // --- Unfavorite ---
        console.log("Attempting to DELETE favorite:", url);
        await apiClient.delete(url);
        setIsFavorite(false); // Update local state immediately
        // Update book state if needed (optional, API doesn't return book on DELETE)
        setBook(prev => ({ ...prev, is_favorite: false }));
        console.log("Unfavorite successful");
      } else {
        // --- Favorite ---
        console.log("Attempting to POST favorite:", url);
        const response = await apiClient.post(url);
        setIsFavorite(true); // Update local state immediately
        // Update book state with potentially updated data from response
        setBook(response.data);
        console.log("Favorite successful:", response.data);
      }
       // Optionally provide user feedback e.g. Alert.alert('Success', isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Favorite toggle failed:', error.response?.data || error);
      Alert.alert('Error', 'Could not update favorites. Please try again.');
      // Revert local state on error? Optional.
      // setIsFavorite(prev => !prev);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const cancelBorrow = async () => {
    if (!borrowingId) {
        Alert.alert("Error", "Cannot find borrowing record ID to cancel.");
        return;
    }
    setIsCancelling(true);
    try {
        console.log(`Attempting DELETE to /borrow/${borrowingId}/cancel_request/`);
        await apiClient.delete(`/borrow/${borrowingId}/cancel_request/`);
        Alert.alert('Success', 'Borrow request cancelled.');
        setBorrowingStatus('none'); // Update local status
        setBorrowingId(null);
        // Maybe refresh book availability data? Optional.
    } catch (error) {
        console.error('Error cancelling borrow request:', error.response?.data || error);
        let errorMessage = 'Could not cancel request.';
        if (error.response?.data?.detail) errorMessage = error.response.data.detail;
        else if (error.response?.data?.error) errorMessage = error.response.data.error;
        Alert.alert('Cancellation Failed', errorMessage);
    } finally {
        setIsCancelling(false);
    }
  };

  // Navigate to Borrow Screen (Initiate Borrow)
  const initiateBorrow = () => {
    if (!token) {
     Alert.alert("Login Required", "Please log in to borrow books.");
     return;
   }
   if (!book || !book.is_available || book.quantity <= 0 || borrowingStatus === 'approved' || borrowingStatus === 'pending') {
     // Should not happen if button logic is correct, but good check
     Alert.alert('Cannot Borrow', 'Book is unavailable or already borrowed/requested.');
     return;
   }
   navigation.navigate('BorrowScreen', { book });
 };

  // Handle Initiate Borrow Action
  const handleBorrow = () => {
     if (!token) {
      Alert.alert("Login Required", "Please log in to borrow books.");
      return;
    }
    if (!book) return;

    // Check availability based on data from API
    if (!book.is_available || book.quantity <= 0) {
      Alert.alert('Unavailable', 'This book is currently out of stock or unavailable for borrowing.');
      return;
    }

    // Navigate to BorrowScreen to select dates etc.
    // The actual API call will happen in BorrowScreen after date selection.
    navigation.navigate('BorrowScreen', { book }); // <-- Navigate to BorrowScreen
  };

  // Defensive check if book data is somehow missing
  if (!book) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text>Book data not found.</Text>
      </View>
    );
  }

  // Prepare display data
  const authorName = book.authors?.length > 0 ? book.authors.map(a => a.name).join(', ') : 'Unknown Author';
  const genreNames = book.genres?.length > 0 ? book.genres.map(g => g.name).join(', ') : 'N/A';
  const coverImageUrl = book.cover_image || DEFAULT_COVER;
  const quantityLabel =
    book.quantity > 1
      ? `${book.quantity} copies available`
      : book.quantity === 1
      ? '1 copy available'
      : 'Out of stock';
  const borrowActionDisabled = !book.is_available || book.quantity <= 0 || borrowingStatus === 'approved' || borrowingStatus === 'pending';

  return (
    // Apply safe area padding
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={{ uri: coverImageUrl }} style={styles.cover} />

        <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.title}>{book.title || 'No Title'}</Text>
                <Text style={styles.author}>by {authorName}</Text>
            </View>
            {/* Favorite Button */}
            <TouchableOpacity onPress={handleFavoriteToggle} disabled={isTogglingFavorite} style={styles.iconButton}>
                {isTogglingFavorite ? (
                    <ActivityIndicator size="small" color="#e53e3e" />
                ) : (
                    <Ionicons
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={32} // Slightly larger icon
                    color={isFavorite ? '#e53e3e' : '#A0AEC0'} // Red for favorite, gray otherwise
                    />
                )}
            </TouchableOpacity>
        </View>

        <View style={styles.detailSection}>
            <Text style={styles.label}>Genre:</Text>
            <Text style={styles.value}>{genreNames}</Text>

            <Text style={styles.label}>Availability:</Text>
            <Text style={[styles.value, { color: book.is_available ? '#2F855A' : '#C53030', fontWeight: 'bold' }]}>
                {book.is_available ? 'Available to Borrow' : 'Currently Unavailable'}
            </Text>

            <Text style={styles.label}>Copies Available:</Text>
            <Text style={styles.value}>{quantityLabel}</Text>

            <Text style={styles.label}>Summary:</Text>
            <Text style={styles.summary}>{book.summary || 'No summary provided for this book.'}</Text>
        </View>

        {/* --- Conditional Action Button Section --- */}
        <View style={styles.actionButtonContainer}>
             {isLoadingStatus ? (
                 <ActivityIndicator size="small" color="#4a5568" />
             ) : borrowingStatus === 'pending' ? (
                 // Show Cancel Button
                 <TouchableOpacity
                     style={[styles.cancelButton, isCancelling && styles.buttonDisabled]}
                     onPress={cancelBorrow}
                     disabled={isCancelling}
                 >
                      {isCancelling ? (
                          <ActivityIndicator size="small" color="#fff" />
                      ) : (
                          <Text style={styles.cancelButtonText}>Cancel Borrow Request</Text>
                      )}
                 </TouchableOpacity>
             ) : borrowingStatus === 'approved' ? (
                 // Show Disabled "Currently Borrowing" Button
                 <TouchableOpacity style={[styles.button, styles.buttonDisabled]} disabled={true}>
                     <Text style={styles.buttonText}>Currently Borrowing</Text>
                 </TouchableOpacity>
             ) : (
                 // Show "Borrow This Book" Button (enabled/disabled based on availability)
                 <TouchableOpacity
                     style={[styles.button, borrowActionDisabled && styles.buttonDisabled]}
                     onPress={initiateBorrow}
                     disabled={borrowActionDisabled}
                 >
                     <Text style={styles.buttonText}>
                         {(!book.is_available || book.quantity <= 0) ? 'Unavailable to Borrow' : 'Borrow This Book'}
                     </Text>
                 </TouchableOpacity>
             )}
        </View>
        </ScrollView>
    </View>
  );
}

// Updated Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Background for the whole screen
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
      padding: 20, // Padding for scroll content
      paddingBottom: 40, // Extra padding at bottom
  },
  cover: {
    width: '100%',
    height: 300, // Larger cover image
    resizeMode: 'cover',
    borderRadius: 12,
    marginBottom: 25, // More space after cover
    backgroundColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Align items
    alignItems: 'flex-start', // Align text top, icon top
    marginBottom: 20,
  },
  iconButton: {
      paddingLeft: 10, // Add padding to prevent text overlap
  },
  title: {
    fontSize: 24, // Larger title
    fontWeight: 'bold',
    color: '#1a202c', // Darker title
    marginBottom: 2,
  },
  author: {
    fontSize: 16,
    color: '#4a5568', // Adjusted author color
    lineHeight: 22,
  },
  detailSection: {
      marginBottom: 25, // Space before borrow button
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      paddingTop: 15,
  },
  label: {
    fontWeight: '600', // Slightly bolder label
    marginTop: 14,
    marginBottom: 4,
    color: '#4a5568', // Label color
    fontSize: 15,
  },
  value: {
    marginBottom: 8,
    color: '#2d3748', // Value color
    fontSize: 16,
    lineHeight: 22,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4a5568', // Summary color
    marginTop: 4,
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0', // Gray when disabled
    opacity: 0.7,
  },
  actionButtonContainer: { // Container for the main action button section
      marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#E53E3E', // Red
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});