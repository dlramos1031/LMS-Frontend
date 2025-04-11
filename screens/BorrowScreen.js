import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function BorrowScreen({ route }) {
  const { book } = route.params;
  const navigation = useNavigation();

  const [borrowDate, setBorrowDate] = useState(new Date());
  const [duration, setDuration] = useState(7);
  const [returnDate, setReturnDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const newReturnDate = new Date(borrowDate);
    newReturnDate.setDate(newReturnDate.getDate() + duration);
    setReturnDate(newReturnDate);
  }, [borrowDate, duration]);

  const handleConfirmBorrow = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const bookRef = doc(db, 'books', book.id);
      await updateDoc(bookRef, {
        available: false,
        borrowedBy: user.uid,
        borrowedAt: borrowDate.toISOString(),
        returnAt: returnDate.toISOString(),
      });

      alert('Book borrowed successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Error borrowing book:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.label}>Duration (days):</Text>

      <View style={styles.durationRow}>
        {[1, 3, 7, 14].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDuration(d)}
            style={[styles.durationButton, duration === d && styles.selected]}
          >
            <Text>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Borrow Date:</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateBox}>
        <Text>{borrowDate.toDateString()}</Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={borrowDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) setBorrowDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>Return Date:</Text>
      <View style={styles.dateBox}>
        <Text>{returnDate.toDateString()}</Text>
      </View>

      <TouchableOpacity style={styles.borrowButton} onPress={handleConfirmBorrow}>
        <Text style={styles.borrowText}>Confirm Borrow</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f8f8',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#222',
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
    color: '#444',
  },
  durationRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  durationButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selected: {
    backgroundColor: '#add8e6',
  },
  dateBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  borrowButton: {
    marginTop: 30,
    backgroundColor: '#1e90ff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  borrowText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});