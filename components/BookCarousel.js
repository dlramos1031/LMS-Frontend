import React, { useState, useCallback } from 'react'; 
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import apiClient from '../services/apiClient'; 
import { useFocusEffect } from '@react-navigation/native'; 

const { width } = Dimensions.get('window');

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
      params.genre = queryText;
    } else if (filter === 'favorites') {
      params.is_favorite = true; 
    } else if (filter === 'recommended') {
      params.limit = 10;
    }

    try {
      const response = await apiClient.get(url, { params });
      const fetchedBooks = response.data.results || response.data;

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
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filter, queryText]);

  useFocusEffect(
    useCallback(() => {
      fetchBooks();
    }, [fetchBooks])
  );

  const renderItem = ({ item }) => {
    const authorName = item.authors?.length > 0 ? item.authors[0].name : 'Unknown Author';
    const coverImageUrl = item.cover_image || DEFAULT_COVER;

    return (
      <TouchableOpacity style={styles.card} onPress={() => onBookPress(item)}>
        <Image
          source={{ uri: coverImageUrl }}
          style={styles.cover}
          resizeMode="cover"
        />
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
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.noBooksText}>No books found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 250, 
    justifyContent: 'center', 
  },
   loader: {
    alignSelf: 'center',
  },
  listContent: {
      paddingHorizontal: 5, 
  },
  card: {
    width: width * 0.38, 
    marginRight: 12,
    marginLeft: 5, 
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minHeight: 230, 
  },
  cover: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#e0e0e0', 
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4, 
    minHeight: 34, 
  },
  author: {
    fontSize: 12,
    color: '#666',
    marginTop: 2, 
  },
  noBooksText: {
    fontStyle: 'italic',
    color: '#666',
    paddingLeft: 10,
    textAlign: 'center', 
    marginTop: 10,
  },
  errorText: {
      color: 'red',
      paddingHorizontal: 10,
      textAlign: 'center',
      marginTop: 10,
  }
});