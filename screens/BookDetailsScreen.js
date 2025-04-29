// Frontend/screens/BookDetailsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView, // Use ScrollView for potentially long summaries
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import hook
// Removed: Firebase imports (doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, setDoc, deleteDoc)
// Removed: import { auth, db } from '../config/firebase';
import { AuthContext } from '../navigation/AuthProvider'; // Import AuthContext
import apiClient from '../services/apiClient'; // Import apiClient
import { Ionicons } from '@expo/vector-icons';

// Default image if book.cover_image is null/empty
const DEFAULT_COVER = 'https://via.placeholder.com/300/CCCCCC/FFFFFF?text=No+Cover';

export default function BookDetailsScreen({ route }) {
  const { book: initialBookData } = route.params; // Get book passed from navigation
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // Get safe area insets
  const { user, token } = useContext(AuthContext); // Get user/token state

  // Local state for favorite status, initialized from passed prop
  const [isFavorite, setIsFavorite] = useState(initialBookData?.is_favorite || false);
  // Use state for book data if you want to update it after fav/borrow actions
  const [book, setBook] = useState(initialBookData);

  // Loading states for actions
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false); // Although borrow action navigates away

   // Update local state if the initial book data changes (e.g., navigating back)
   useEffect(() => {
    setBook(initialBookData);
    setIsFavorite(initialBookData?.is_favorite || false);
  }, [initialBookData]);

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
  const borrowDisabled = !book.is_available || book.quantity <= 0;


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

        {/* Borrow Button */}
        <TouchableOpacity
            style={[styles.button, borrowDisabled && styles.buttonDisabled]}
            onPress={handleBorrow}
            disabled={borrowDisabled}
        >
            <Text style={styles.buttonText}>
            {borrowDisabled ? 'Unavailable to Borrow' : 'Borrow This Book'}
            </Text>
        </TouchableOpacity>
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
    backgroundColor: '#3b82f6', // Use consistent blue
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, // Adjusted margin
  },
  buttonDisabled: {
    backgroundColor: '#a0aec0', // Gray when disabled
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});