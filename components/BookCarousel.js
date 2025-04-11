import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const { width } = Dimensions.get('window');

export default function BookCarousel({ filter, queryText, onBookPress }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'books'));
        const allBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let filteredBooks = [];

        if (filter === 'search' && queryText) {
          const lower = queryText.toLowerCase();
          filteredBooks = allBooks.filter(book =>
            book.title?.toLowerCase().includes(lower) ||
            book.author?.toLowerCase().includes(lower) ||
            book.genre?.toLowerCase().includes(lower)
          );
        } else if (filter === 'genre' && queryText) {
          filteredBooks = allBooks.filter(
            book => book.genre?.toLowerCase() === queryText.toLowerCase()
          );
        } else {
          // default: show all books
          filteredBooks = allBooks;
        }

        setBooks(filteredBooks);
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchBooks();
  }, [filter, queryText]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => onBookPress(item)}>
      <Image
        source={{ uri: item.coverImage }}
        style={styles.cover}
        resizeMode="cover"
      />
      <Text numberOfLines={2} style={styles.title}>{item.title}</Text>
      <Text numberOfLines={1} style={styles.author}>{item.author}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {books.length > 0 ? (
        <FlatList
          data={books}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noBooksText}>No books found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
  },
  card: {
    width: width * 0.4,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  cover: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  author: {
    fontSize: 12,
    color: '#666',
  },
  noBooksText: {
    fontStyle: 'italic',
    color: '#666',
    paddingLeft: 10,
    marginTop: 10,
  },
});
