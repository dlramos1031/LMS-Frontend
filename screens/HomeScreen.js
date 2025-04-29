import React, { useEffect, useState, useContext, useCallback } from 'react'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import { AuthContext } from '../navigation/AuthProvider'; 
import apiClient from '../services/apiClient'; 
import BookCarousel from '../components/BookCarousel';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasFavorites, setHasFavorites] = useState(false); 

  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);

  // Function to check if user has any favorite books via API
   const checkFavorites = useCallback(async () => {
    if (!token) {
      setHasFavorites(false); // Ensure favorites is false if not logged in
      return;
    }
    try {
      const response = await apiClient.get('/books/', { params: { is_favorite: true, limit: 1 } });
      setHasFavorites(response.data.results?.length > 0 || response.data?.length > 0);
    } catch (error) {
      console.error('Failed to check for favorites:', error);
      setHasFavorites(false); // Assume no favorites on error
    }
  }, [token]);

  useEffect(() => {
    // Set user name from Auth context
    if (user) {
      setUserName(user.full_name || user.username || ''); // Use full_name or fallback to username
      setInitialLoading(false);
    } else {
      // Handle user being logged out or not yet loaded
      setUserName('');
      setHasFavorites(false); // Ensure favorites cleared on logout
      setInitialLoading(false);
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

  // Show main loader only if initial load AND user data isn't set yet
  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#1976d2"/>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside input
      >
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
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f6f9' 
  }, 
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16, 
    color: '#333',
    marginTop: Platform.OS === 'android' ? 10 : 0,
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
    borderColor: '#e0e0e0', 
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
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
  },
});