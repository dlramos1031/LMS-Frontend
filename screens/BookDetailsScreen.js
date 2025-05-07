// LMS/Frontend/screens/BookDetailsScreen.js
import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../navigation/AuthProvider';
import apiClient from '../services/apiClient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ExpandableText from '../components/ExpandableText'; // Import the new component

const DEFAULT_COVER = 'https://via.placeholder.com/300/CCCCCC/FFFFFF?text=No+Cover';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const DetailItem = ({ label, value, iconName }) => (
  <View style={styles.detailItemContainer}>
    {iconName && <MaterialCommunityIcons name={iconName} size={20} color="#4A5568" style={styles.detailIcon} />}
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value || 'N/A'}</Text>
  </View>
);

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

  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const MAX_INITIAL_DETAILS = 5;

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
        await apiClient.delete(url);
        setIsFavorite(false);
        setBook(prev => ({ ...prev, is_favorite: false }));
      } else {
        await apiClient.post(url);
        setIsFavorite(true);
        setBook(prev => ({ ...prev, is_favorite: true }));
      }
       Alert.alert('Success', !isFavorite ? 'Added to favorites' : 'Removed from favorites');
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
    Alert.alert(
        "Cancel Request",
        "Are you sure you want to cancel this borrow request?",
        [
            { text: "No", style: "cancel" },
            {
                text: "Yes",
                onPress: async () => {
                    setIsCancelling(true);
                    try {
                        await apiClient.delete(`/borrow/${borrowingId}/cancel-request/`);
                        Alert.alert('Success', 'Borrow request cancelled.');
                        fetchBookDetailsAndStatus();
                    } catch (error) {
                        console.error('Error cancelling borrow request:', error.response?.data || error);
                        let errorMessage = 'Could not cancel request.';
                        if (error.response?.data?.detail) errorMessage = error.response.data.detail;
                        else if (error.response?.data?.error) errorMessage = error.response.data.error;
                        Alert.alert('Cancellation Failed', errorMessage);
                    } finally {
                        setIsCancelling(false);
                    }
                },
                style: "destructive"
            }
        ]
    );
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

  if (isLoadingStatus && !book?.title) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1976d2"/>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Book data not found.</Text>
      </View>
    );
  }

  const authorName = book.authors?.length > 0 ? book.authors.map(a => a.name).join(', ') : 'Unknown Author';
  const genreNames = book.genres?.length > 0 ? book.genres.map(g => g.name).join(', ') : 'N/A';
  const coverImageUrl = book.cover_image || DEFAULT_COVER;
  const quantityLabel = book.quantity > 1 ? `${book.quantity} copies` : book.quantity === 1 ? '1 copy' : 'Out of stock';
  const borrowActionDisabled = !book.is_available || book.quantity <= 0 || borrowingStatus === 'approved' || borrowingStatus === 'pending';

  const allDetailItems = [
    { label: "Genre", value: genreNames, iconName: "tag-multiple-outline" },
    { label: "Availability", value: book.is_available ? 'Available' : 'Unavailable', iconName: "check-circle-outline" },
    { label: "Copies", value: quantityLabel, iconName: "book-multiple-outline" },
    book.publisher && { label: "Publisher", value: book.publisher, iconName: "domain" },
    book.publish_date && { label: "Published", value: formatDate(book.publish_date), iconName: "calendar-month-outline" },
    book.language && { label: "Language", value: book.language, iconName: "translate" },
    book.page_count && { label: "Pages", value: book.page_count.toString(), iconName: "book-open-page-variant-outline" },
    book.isbn_13 && { label: "ISBN-13", value: book.isbn_13, iconName: "barcode-scan" },
    book.isbn_10 && { label: "ISBN-10", value: book.isbn_10, iconName: "barcode" },
    book.open_library_id && { label: "OpenLibrary ID", value: book.open_library_id, iconName: "library" },
    { label: "Total Borrows", value: (book.total_borrows || 0).toString(), iconName: "chart-line-variant" },
  ].filter(Boolean); 

  const visibleDetails = detailsExpanded ? allDetailItems : allDetailItems.slice(0, MAX_INITIAL_DETAILS);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          {visibleDetails.map((item, index) => (
            <DetailItem key={index} label={item.label} value={item.value} iconName={item.iconName} />
          ))}
          {allDetailItems.length > MAX_INITIAL_DETAILS && (
            <TouchableOpacity onPress={() => setDetailsExpanded(!detailsExpanded)}>
              <Text style={styles.toggleText}>
                {detailsExpanded ? 'See less details' : 'See more details'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <ExpandableText
            text={book.summary || 'No summary provided.'}
            style={styles.summary}
            numberOfLines={5} 
            seeMoreStyle={styles.toggleText}
            seeLessStyle={styles.toggleText}
          />
        </View>
      </ScrollView>

      <View style={styles.fixedActionContainer}>
          {isLoadingStatus ? (
            <ActivityIndicator size="large" color="#4A90E2" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
    backgroundColor: '#e2e8f0',
  },
  mainInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleAuthorSection: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: '#475569',
  },
  favoriteButton: {
    padding: 8,
  },
  section: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  detailIcon: {
    marginRight: 10,
    marginTop: Platform.OS === 'ios' ? 1 : 3,
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
    flexShrink: 1,
    lineHeight: 20,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  toggleText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 8,
    fontSize: 14,
  },
  fixedActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonBase: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  borrowButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

