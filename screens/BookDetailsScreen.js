import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function BookDetailsScreen({ route }) {
  const { book } = route.params;
  const navigation = useNavigation();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchFavorite = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const favRef = doc(db, 'users', userId, 'favorites', book.id);
        const favSnap = await getDoc(favRef);
        setIsFavorite(favSnap.exists());
      }
    };

    fetchFavorite();
  }, [book.id]);

  const handleFavoriteToggle = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const favRef = doc(db, 'users', userId, 'favorites', book.id);

    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
      } else {
        await setDoc(favRef, { bookId: book.id, addedAt: serverTimestamp() });
        setIsFavorite(true);
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleBorrow = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      if (book.quantity <= 0 || !book.available) {
        Alert.alert('Unavailable', 'This book is currently out of stock or unavailable.');
        return;
      }

      await addDoc(collection(db, 'borrowedBooks'), {
        userId,
        bookId: book.id,
        borrowedAt: serverTimestamp(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        returned: false,
      });

      const bookRef = doc(db, 'books', book.id);
      const newQuantity = book.quantity - 1;
      await updateDoc(bookRef, {
        quantity: newQuantity,
        available: newQuantity > 0,
      });

      Alert.alert('Success', 'You have borrowed this book.');
      navigation.navigate('YourBooksScreen');
    } catch (error) {
      console.error('Borrow failed:', error);
      Alert.alert('Error', 'Failed to borrow this book.');
    }
  };

  const quantityLabel =
    book.quantity > 1
      ? `${book.quantity} copies available`
      : book.quantity === 1
      ? '1 copy available'
      : 'Out of stock';

  const borrowDisabled = book.quantity <= 0 || !book.available;

  return (
    <View style={styles.container}>
      <Image source={{ uri: book.coverImage }} style={styles.cover} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
        </View>
        <TouchableOpacity onPress={handleFavoriteToggle}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? 'red' : 'gray'}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Genre:</Text>
      <Text style={styles.value}>{book.genre}</Text>

      <Text style={styles.label}>Availability:</Text>
      <Text style={[styles.value, { color: book.available ? 'green' : 'red' }]}>
        {book.available ? 'Available to Borrow' : 'Currently Unavailable'}
      </Text>

      <Text style={styles.label}>Quantity Available:</Text>
      <Text style={styles.value}>{quantityLabel}</Text>

      <Text style={styles.label}>Summary:</Text>
      <Text style={styles.summary}>{book.summary || 'No summary provided for this book.'}</Text>

      <TouchableOpacity
        style={[styles.button, borrowDisabled && { backgroundColor: '#ccc' }]}
        onPress={handleBorrow}
        disabled={borrowDisabled}
      >
        <Text style={styles.buttonText}>
          {borrowDisabled ? 'Unavailable to Borrow' : 'Borrow This Book'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  cover: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
    borderRadius: 12,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
  },
  author: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
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
