import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BookCard({ title, author, available }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.author}>{author}</Text>
      <Text style={styles.availability}>{available ? 'Available' : 'Unavailable'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    color: '#666',
  },
  availability: {
    fontSize: 12,
    color: '#2e7d32',
    marginTop: 5,
  },
});