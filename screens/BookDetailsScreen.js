import React, { useState, useContext, useCallback } from 'react';
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
import { AuthContext } from '../navigation/AuthProvider'; 
import apiClient from '../services/apiClient'; 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const DEFAULT_COVER = 'https://via.placeholder.com/300/CCCCCC/FFFFFF?text=No+Cover';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function BookDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);
  const { book: initialBookData } = route.params;

  const [book, setBook] = useState(initialBookData);
  const [isFavorite, setIsFavorite] = useState(initialBookData?.is_favorite || false);
  const [borrowingStatus, setBorrowingStatus] = useState(null); 
  const [borrowingId, setBorrowingId] = useState(null); 
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookDetailsAndStatus = useCallback(async () => {
    if (!book?.id) {
      setIsLoadingStatus(false);
      return;
    }
    setIsLoadingStatus(true);
    try {
      const bookResponse = await apiClient.get(`/books/${book.id}/`);
      const fetchedBook = bookResponse.data;
      setBook(fetchedBook);
      setIsFavorite(fetchedBook?.is_favorite || false);

      if (token) {
        const borrowResponse = await apiClient.get('/borrow/');
        const borrowings = borrowResponse.data?.results || borrowResponse.data || [];
        const relevantBorrowing = borrowings.find(
          b => b.book.id === fetchedBook.id && (b.status === 'approved' || b.status === 'pending')
        );
        if (relevantBorrowing) {
          setBorrowingStatus(relevantBorrowing.status);
          setBorrowingId(relevantBorrowing.id);
        } else {
          setBorrowingStatus('none');
          setBorrowingId(null);
        }
      } else {
        setBorrowingStatus('none');
        setBorrowingId(null);
      }
    } catch (error) {
      console.error("Failed to fetch book details or status:", error.response?.data || error);
      Alert.alert("Error", "Could not load book details. Please try again.");
      setBorrowingStatus('error');
    } finally {
      setIsLoadingStatus(false);
    }
  }, [book?.id, token]);

  useFocusEffect(
    useCallback(() => {
      if (initialBookData?.id) {
          setBook(prevBook => ({ ...prevBook, ...initialBookData }));
          fetchBookDetailsAndStatus();
      }
    }, [initialBookData, fetchBookDetailsAndStatus])
  );

  const handleFavoriteToggle = async () => {
    if (!token) {
      Alert.alert("Login Required", "Please log in to add favorites.");
      return;
    }
    if (!book || !book.id) return;

    setIsTogglingFavorite(true);
    const url = `/books/${book.id}/favorite/`;

    try {
      if (isFavorite) {
        // --- Unfavorite ---
        await apiClient.delete(url);
        setIsFavorite(false);
        setBook(prev => ({ ...prev, is_favorite: false }));
      } else {
        // --- Favorite ---
        await apiClient.post(url);
        setIsFavorite(true);
        setBook(prev => ({ ...prev, is_favorite: true }));
      }
       Alert.alert('Success', isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Favorite toggle failed:', error.response?.data || error);
      Alert.alert('Error', 'Could not update favorites. Please try again.');
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
        await apiClient.delete(`/borrow/${borrowingId}/cancel_request/`);
        Alert.alert('Success', 'Borrow request cancelled.');
        setBorrowingStatus('none');
        setBorrowingId(null);
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

  const handleBorrow = () => {
    if (!token) {
     Alert.alert("Login Required", "Please log in to borrow books.");
     return;
   }
   if (!book || !book.is_available || book.quantity <= 0 || borrowingStatus === 'approved' || borrowingStatus === 'pending') {
     Alert.alert('Cannot Borrow', 'Book is unavailable or already borrowed/requested.');
     return;
   }
   navigation.navigate('BorrowScreen', { book });
 };

  if (!book) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text>Book data not found.</Text>
      </View>
    );
  }

  const authorName = book.authors?.length > 0 ? book.authors.map(a => a.name).join(', ') : 'Unknown Author';
  const genreNames = book.genres?.length > 0 ? book.genres.map(g => g.name).join(', ') : 'N/A';
  const coverImageUrl = book.cover_image || DEFAULT_COVER;
  const quantityLabel = book.quantity > 1 ? `${book.quantity} copies` : book.quantity === 1 ? '1 copy' : 'Out of stock';
  const borrowActionDisabled = !book.is_available || book.quantity <= 0 || borrowingStatus === 'approved' || borrowingStatus === 'pending';

  const DetailItem = ({ label, value, iconName }) => (
    <View style={styles.detailItemContainer}>
      {iconName && <MaterialCommunityIcons name={iconName} size={20} color="#4A5568" style={styles.detailIcon} />}
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Image source={{ uri: coverImageUrl }} style={styles.coverImage} />

      <View style={styles.mainInfoContainer}>
        <View style={styles.titleAuthorSection}>
            <Text style={styles.title}>{book.title || 'No Title'}</Text>
            <Text style={styles.author}>by {authorName}</Text>
        </View>
        <TouchableOpacity onPress={handleFavoriteToggle} disabled={isTogglingFavorite} style={styles.favoriteButton}>
            {isTogglingFavorite ? (
                <ActivityIndicator size="small" color="#e53e3e" />
            ) : (
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={30} color={isFavorite ? '#e53e3e' : '#A0AEC0'} />
            )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Book Details</Text>
        <DetailItem label="Genre" value={genreNames} iconName="tag-multiple-outline" />
        <DetailItem label="Availability" value={book.is_available ? 'Available' : 'Unavailable'} iconName="check-circle-outline" />
        <DetailItem label="Copies" value={quantityLabel} iconName="book-multiple-outline" />
        {book.publisher && <DetailItem label="Publisher" value={book.publisher} iconName="domain" />}
        {book.publish_date && <DetailItem label="Published" value={formatDate(book  .publish_date)} iconName="calendar-month-outline" />}
        {book.language && <DetailItem label="Language" value={book.language} iconName="translate" />}
        {book.page_count && <DetailItem label="Pages" value={book.page_count.toString()} iconName="book-open-page-variant-outline" />}
        {book.isbn_13 && <DetailItem label="ISBN-13" value={book.isbn_13} iconName="barcode-scan" />}
        {book.isbn_10 && <DetailItem label="ISBN-10" value={book.isbn_10} iconName="barcode" />}
        {book.open_library_id && <DetailItem label="OpenLibrary ID" value={book.open_library_id} iconName="library-outline" />}
        <DetailItem label="Total Borrows" value={(book.total_borrows || 0).toString()} iconName="chart-line-variant" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.summary}>{book.summary || 'No summary provided.'}</Text>
      </View>

      <View style={styles.actionButtonContainer}>
        {isLoadingStatus ? (
          <ActivityIndicator size="large" color="#4A90E2" style={{ marginVertical: 20 }} />
        ) : borrowingStatus === 'pending' ? (
          <TouchableOpacity
            style={[styles.buttonBase, styles.cancelButton, isCancelling && styles.buttonDisabled]}
            onPress={cancelBorrow}
            disabled={isCancelling}>
            {isCancelling ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Cancel Borrow Request</Text>}
          </TouchableOpacity>
        ) : borrowingStatus === 'approved' ? (
          <TouchableOpacity style={[styles.buttonBase, styles.buttonDisabled]} disabled={true}>
            <Text style={styles.buttonText}>Currently Borrowing</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.buttonBase, styles.borrowButton, borrowActionDisabled && styles.buttonDisabled]}
            onPress={handleBorrow}
            disabled={borrowActionDisabled}>
            <Text style={styles.buttonText}>
              {!book.is_available || book.quantity <= 0 ? 'Unavailable' : 'Borrow This Book'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 30, // Space at the bottom
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 320, // Increased height
    resizeMode: 'cover', // Or 'contain' if you prefer
    backgroundColor: '#e2e8f0',
  },
  mainInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the top
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff', // White background for this section
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleAuthorSection: {
    flex: 1, // Take available space
    marginRight: 10,
  },
  title: {
    fontSize: 22, // Slightly larger title
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: '#475569',
  },
  favoriteButton: {
    padding: 8, // Make it easier to tap
  },
  section: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff', // White background for sections
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },
  detailItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align icon with the start of the text
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
    marginTop: 2, // Align icon nicely with text
  },
  label: {
    fontWeight: '500',
    color: '#475569',
    fontSize: 15,
    marginRight: 6,
  },
  value: {
    color: '#1e293b',
    fontSize: 15,
    flexShrink: 1, // Allow value text to wrap if long
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  buttonBase: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  borrowButton: {
    backgroundColor: '#3b82f6', // Blue
  },
  cancelButton: {
    backgroundColor: '#ef4444', // Red
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1', // Grey
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});