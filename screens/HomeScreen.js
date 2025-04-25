import React, { useEffect, useState, useContext, useCallback } from 'react'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import { AuthContext } from '../navigation/AuthProvider'; 
import apiClient from '../services/apiClient'; 
import BookCarousel from '../components/BookCarousel';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [hasFavorites, setHasFavorites] = useState(false); 

  const navigation = useNavigation();
  const { user } = useContext(AuthContext); 

  // Function to check if user has any favorite books via API
   const checkFavorites = useCallback(async () => {
    try {
      const response = await apiClient.get('/books/', { params: { is_favorite: true, limit: 1 } });
      setHasFavorites(response.data.results?.length > 0 || response.data?.length > 0);
    } catch (error) {
      console.error('Failed to check for favorites:', error);
      setHasFavorites(false); // Assume no favorites on error
    }
  }, []);

  useEffect(() => {
    // Set user name from Auth context
    if (user) {
      setUserName(user.full_name || user.username || ''); // Use full_name or fallback to username
      setLoadingUser(false);
    } else {
      // Handle case where user data might not be loaded yet or user is logged out
      setLoadingUser(false); // Stop loading even if user is null
    }
  }, [user]); // Re-run when user context changes

  // Use useFocusEffect to check for favorites when the screen comes into focus
  useFocusEffect(
      useCallback(() => {
          if(user) { // Only check if user is logged in
              checkFavorites();
          } else {
              setHasFavorites(false); // No favorites if not logged in
          }
      }, [user, checkFavorites])
  );


  const handleBookPress = (book) => {
    // Navigate to BookDetailsScreen, passing the book object received from API
    // Ensure the receiving screen handles the data structure correctly
    navigation.navigate('BookDetailsScreen', { book });
  };

  // Show main loader only if user data is loading initially
  if (loadingUser && !userName) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#1976d2"/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside input
      >
        <Text style={styles.greeting}>
          Welcome back, <Text style={styles.name}>{userName || 'User'}</Text> 👋
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors, or genres"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#aaa"
            returnKeyType="search" // Set keyboard return key
          />
        </View>

        {/* Conditional Rendering based on search */}
        {search.trim().length > 0 ? (
          // Show Search Results Carousel
          <View style={styles.section}>
            <Text style={styles.heading}>
              <Ionicons name="search" size={18} /> Search Results
            </Text>
            <BookCarousel
              filter="search"
              queryText={search.trim()} // Pass search query directly
              onBookPress={handleBookPress}
            />
          </View>
        ) : (
          // Show Default Carousels (Favorites, Recommended, Genres)
          <>
            {/* Favorites Section - Conditionally rendered */}
            {hasFavorites && (
              <View style={styles.section}>
                <Text style={styles.heading}>
                  <MaterialCommunityIcons name="heart-outline" size={18} color="#555" /> Favorites
                </Text>
                <BookCarousel
                  filter="favorites" // Will use API filter /books/?is_favorite=true
                  onBookPress={handleBookPress}
                  // No need to pass favoriteIds anymore
                />
              </View>
            )}

            {/* Recommended Section */}
            <View style={styles.section}>
              <Text style={styles.heading}>
                <MaterialCommunityIcons name="star-outline" size={18} color="#555" /> Recommended
              </Text>
              <BookCarousel filter="recommended" onBookPress={handleBookPress} />
            </View>

            {/* Genre Sections */}
            <GenreSection icon="book-open-page-variant" label="Comics" query="comics" onBookPress={handleBookPress} />
            <GenreSection icon="school-outline" label="Educational" query="educational" onBookPress={handleBookPress} />
            <GenreSection icon="feather" label="Fictions" query="fictions" onBookPress={handleBookPress} />
            <GenreSection icon="magnify" label="Mystery" query="mystery" onBookPress={handleBookPress} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// GenreSection component remains the same
function GenreSection({ icon, label, query, onBookPress }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>
        <MaterialCommunityIcons name={icon} size={18} color="#555" /> {label}
      </Text>
      <BookCarousel filter="genre" queryText={query} onBookPress={onBookPress} />
    </View>
  );
}

// Styles remain largely the same
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
   centered: { // Added for centering loader
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    paddingTop: 20, // Reduced top padding
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16, // Increased margin
    color: '#333',
  },
  name: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#e0e0e0', // Lighter border
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
    flexDirection: 'row', // Align icon and text
    alignItems: 'center', // Align icon and text
  },
});