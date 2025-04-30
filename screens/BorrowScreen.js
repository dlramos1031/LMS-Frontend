import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import apiClient from '../services/apiClient';
import { AuthContext } from '../navigation/AuthProvider'; 
import { Ionicons } from '@expo/vector-icons';

// Helper function to format date to YYYY-MM-DD
const formatDate = (date) => {
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

  const initialReturnDate = new Date();
  initialReturnDate.setDate(initialReturnDate.getDate() + 7);
  
  const [returnDate, setReturnDate] = useState(initialReturnDate);
  const [showPicker, setShowPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || returnDate; 
    setShowPicker(Platform.OS === 'ios'); 

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    if (currentDate < today) {
      Alert.alert("Invalid Date", "Return date cannot be in the past.");
      setReturnDate(new Date(today.setDate(today.getDate() + 1))); 
    } else {
      setReturnDate(currentDate);
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

    const formattedReturnDate = formatDate(returnDate);
    try {
      console.log(`Attempting to borrow book ID: ${book.id} with return date: ${formattedReturnDate}`);
      const response = await apiClient.post('/borrow/borrow/', {
        book: book.id,
        return_date: formattedReturnDate,
      });

      Alert.alert(
        'Borrow Request Submitted',
        `Your request to borrow "${book.title}" until ${formattedReturnDate} has been submitted.` +
        (response.data?.status === 'pending' ? ' Please wait for librarian approval.' : '') 
      );
      navigation.navigate('Tabs', { screen: 'YourBooksScreen' }); 

    } catch (error) {
      console.error("Borrow failed:", error.response?.data || error);
      let errorMessage = 'Could not submit borrow request.';
      if (error.response?.data) {
         const errors = error.response.data;
         if (errors.error) { 
             errorMessage = errors.error;
         } else {
             const errorMessages = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`);
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
            <Text style={styles.headerTitle}>Borrow Book</Text>
            <View style={styles.bookInfo}>
                <Text style={styles.titleLabel}>Book Title:</Text>
                <Text style={styles.title}>{book?.title || 'N/A'}</Text>
            </View>

            <Text style={styles.label}>Select Return Date:</Text>

            {/* Button to open date picker */}
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateDisplay}>
                <Ionicons name="calendar-outline" size={20} color="#4A5568" />
                <Text style={styles.dateText}>{returnDate.toDateString()}</Text>
            </TouchableOpacity>

            {/* Show DateTimePicker when state is true */}
            {showPicker && (
                <DateTimePicker
                    value={returnDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeDate}
                    minimumDate={new Date()} // Prevent selecting past dates
                    // maximumDate={ // Optional: Set a max borrow duration limit }
                />
            )}

            {/* Confirm Button */}
            <TouchableOpacity
                style={[styles.borrowButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleConfirmBorrow}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.borrowText}>Confirm Borrow Request</Text>
                )}
            </TouchableOpacity>

             {/* Back Button */}
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