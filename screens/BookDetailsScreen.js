import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function BookDetailsScreen({ route }) {
  const { book } = route.params;
  const navigation = useNavigation();

  const handleBorrow = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      // 1. Add to borrowedBooks collection
      await addDoc(collection(db, 'borrowedBooks'), {
        userId,
        bookId: book.id,
        borrowedAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        returned: false,
      });

      // 2. Update the book's availability
      const bookRef = doc(db, 'books', book.id);
      await updateDoc(bookRef, { available: false });

      Alert.alert('Success', 'You have borrowed this book.');
      navigation.navigate('YourBooksScreen');
    } catch (error) {
      console.error('Borrow failed:', error);
      Alert.alert('Error', 'Failed to borrow this book.');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: book.coverImage }} style={styles.cover} />

      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>by {book.author}</Text>

      <Text style={styles.label}>Genre:</Text>
      <Text style={styles.value}>{book.genre}</Text>

      <Text style={styles.label}>Availability:</Text>
      <Text style={[styles.value, { color: book.available ? 'green' : 'red' }]}>
        {book.available ? 'Available to Borrow' : 'Currently Unavailable'}
      </Text>

      <Text style={styles.label}>Summary:</Text>
      <Text style={styles.summary}>
        {book.summary || 'No summary provided for this book.'}
      </Text>

      {book.available && (
        <TouchableOpacity style={styles.button} onPress={handleBorrow}>
          <Text style={styles.buttonText}>Borrow This Book</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fdfdfd',
  },
  cover: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    borderRadius: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  author: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 12,
    color: '#444',
  },
  value: {
    marginBottom: 6,
    color: '#333',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
    marginTop: 8,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#4a90e2',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
