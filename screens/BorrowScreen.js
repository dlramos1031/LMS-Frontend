import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../services/apiClient';
import { AuthContext } from '../navigation/AuthProvider';
import { Ionicons } from '@expo/vector-icons'; 

// Helper function to format date to YYYY-MM-DD
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (`0${d.getMonth() + 1}`).slice(-2); 
  const day = (`0${d.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
};

export default function BorrowScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { token } = useContext(AuthContext); 
  const { book } = route.params; 

  const initialDueDate = new Date();
  initialDueDate.setDate(initialDueDate.getDate() + 7);

  const [dueDate, setDueDate] = useState(initialDueDate); 
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate; 
    setShowPicker(Platform.OS === 'ios'); 

    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    // Prevent selecting past dates
    if (currentDate < today) {
      Alert.alert("Invalid Date", "Due date cannot be in the past.");
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      setDueDate(tomorrow);
    } else {
      setDueDate(currentDate); 
    }
  };

  const handleConfirmBorrow = async () => {
    if (!token) {
      Alert.alert("Login Required", "Please log in to borrow books.");
      return;
    }
    if (!book || !book.id) {
      Alert.alert("Error", "Book information is missing.");
      return;
    }

    setIsSubmitting(true);
    const formattedDueDate = formatDate(dueDate);

    try {
      console.log(`Attempting borrow request for book ID: ${book.id} with due date: ${formattedDueDate}`);
      await apiClient.post('/borrow/request-borrow/', {
        book_id: book.id, 
        due_date: formattedDueDate,
      });

      Alert.alert(
        'Borrow Request Submitted',
        `Your request to borrow "${book.title}" with a due date of ${formattedDueDate} has been submitted. Please wait for librarian approval.`
      );
      navigation.navigate('Tabs', { screen: 'YourBooksScreen' }); 

    } catch (error) {
      console.error("Borrow request failed:", error.response?.data || error.message);
      let errorMessage = 'Could not submit borrow request.';
      if (error.response?.data) {
         const errors = error.response.data;
         if (errors.error) {
             errorMessage = errors.error;
         } else {
             const errorMessages = Object.keys(errors)
                .map(key => `${key}: ${Array.isArray(errors[key]) ? errors[key].join(', ') : errors[key]}`);
             if (errorMessages.length > 0) errorMessage = errorMessages.join('\n');
             else if (errors.detail) errorMessage = errors.detail; 
         }
      }
      Alert.alert('Borrow Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Header */}
            <Text style={styles.headerTitle}>Request to Borrow</Text>

            {/* Book Info Display */}
            <View style={styles.bookInfo}>
                <Text style={styles.titleLabel}>Book Title:</Text>
                <Text style={styles.title}>{book?.title || 'N/A'}</Text>
                {/* Add other book details if desired */}
            </View>

            {/* Date Selection Label */}
            <Text style={styles.label}>Select Due Date:</Text>

            {/* Button to open date picker */}
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateDisplay}>
                <Ionicons name="calendar-outline" size={20} color="#4A5568" />
                <Text style={styles.dateText}>{dueDate.toDateString()}</Text>
            </TouchableOpacity>

            {/* Date Picker Component */}
            {showPicker && (
                <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeDate}
                    minimumDate={new Date()}
                    // maximumDate={...} // Optional: Set a max borrow duration
                />
            )}

            {/* Confirm Button */}
            <TouchableOpacity
                style={[styles.borrowButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleConfirmBorrow}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text style={styles.borrowText}>Submit Borrow Request</Text>
                )}
            </TouchableOpacity>

             {/* Cancel/Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={isSubmitting}
            >
                <Text style={styles.backText}>Cancel</Text>
            </TouchableOpacity>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
      padding: 24,
      paddingTop: 20, 
  },
  headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1a202c',
      marginBottom: 25,
      textAlign: 'center',
  },
  bookInfo: {
      marginBottom: 25,
      padding: 15,
      backgroundColor: '#fff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
  },
  titleLabel: {
      fontSize: 14,
      color: '#718096',
      marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginVertical: 10,
    color: '#4a5568',
  },
   dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 20,
  },
  dateText: {
      fontSize: 16,
      color: '#2d3748',
      marginLeft: 10,
  },
  borrowButton: {
    marginTop: 30,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  borrowText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  backButton: {
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  backText: {
    color: '#4a5568',
    fontWeight: '500',
    fontSize: 16,
  },
});