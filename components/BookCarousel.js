import React, { useEffect, useState, useCallback } from 'react'; 
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import apiClient from '../services/apiClient'; 
import { useFocusEffect } from '@react-navigation/native'; 

const { width } = Dimensions.get('window');

// Default image if book.cover_image is null/empty
const DEFAULT_COVER = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Cover';

export default function BookCarousel({ filter, queryText = '', onBookPress }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    let url = '/books/';
    const params = {};

    // Construct URL and params based on filter type
    if (filter === 'search' && queryText) {
      params.search = queryText;
    } else if (filter === 'genre' && queryText) {
      params.genre = queryText; // Uses the 'genres__name__icontains' filter
    } else if (filter === 'favorites') {
      params.is_favorite = true; // Uses the custom 'is_favorite' filter
    } else if (filter === 'recommended') {
      // Add logic for recommended if needed (e.g., based on borrowing history or popularity)
      // For now, just fetches first page of all books
      // params.ordering = '-total_borrows'; // Example: order by popularity
      params.limit = 10; // Example: Limit results
    }
    // Add other filters as needed

    try {
      console.log(`Fetching books from ${url} with params:`, params); // Log API call details
      const response = await apiClient.get(url, { params });

      // Handle potential pagination (DRF default)
      const fetchedBooks = response.data.results || response.data; // Use results if paginated, else data

      if (Array.isArray(fetchedBooks)) {
          setBooks(fetchedBooks);
      } else {
          console.error("Fetched data is not an array:", fetchedBooks);
          setBooks([]);
          setError("Received invalid data format.");
      }
    } catch (err) {
      console.error('Error fetching books:', err.response || err);
      setError('Failed to load books.');
      setBooks([]); // Clear books on error
    } finally {
      setLoading(false);
    }
  }, [filter, queryText]); // Dependencies for useCallback

  // Use useFocusEffect to refetch data when the screen comes into focus,
  // especially useful for the 'favorites' carousel.
  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [fetchBooks])
  );

  const renderItem = ({ item }) => {
    // Extract first author's name for display, or default text
    const authorName = item.authors?.length > 0 ? item.authors[0].name : 'Unknown Author';
    // Use default cover if item.cover_image is missing
    const coverImageUrl = item.cover_image || DEFAULT_COVER;

    return (
      <TouchableOpacity style={styles.card} onPress={() => onBookPress(item)}>
        <Image
          source={{ uri: coverImageUrl }}
          style={styles.cover}
          resizeMode="cover"
        />
        {/* Display is_favorite status if available (useful for debugging) */}
        {/* {item.is_favorite !== undefined && <Text style={{ fontSize: 10, color: 'red' }}>F:{item.is_favorite ? 'T' : 'F'}</Text>} */}
        <Text numberOfLines={2} style={styles.title}>{item.title || 'No Title'}</Text>
        <Text numberOfLines={1} style={styles.author}>{authorName}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={styles.loader}/>
      ) : error ? (
         <Text style={styles.errorText}>{error}</Text>
      ) : books.length > 0 ? (
        <FlatList
          data={books}
          keyExtractor={item => item.id.toString()} // Ensure key is a string
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent} // Add padding for list
        />
      ) : (
        <Text style={styles.noBooksText}>No books found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 250, // Use minHeight to allow for loader/error messages
    justifyContent: 'center', // Center loader/messages vertically
  },
   loader: {
    alignSelf: 'center',
  },
  listContent: {
      paddingHorizontal: 5, // Optional padding for the start/end of list
  },
  card: {
    width: width * 0.38, // Slightly wider card
    marginRight: 12,
    marginLeft: 5, // Add left margin
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minHeight: 230, // Ensure consistent card height
  },
  cover: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#e0e0e0', // Placeholder background color
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4, // Add some top margin
    minHeight: 34, // Reserve space for two lines
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginTop: 2, // Add slight margin
  },
  noBooksText: {
    fontStyle: 'italic',
    color: '#666',
    paddingLeft: 10,
    textAlign: 'center', // Center text if no books
    marginTop: 10,
  },
  errorText: {
      color: 'red',
      paddingHorizontal: 10,
      textAlign: 'center',
      marginTop: 10,
  }
});