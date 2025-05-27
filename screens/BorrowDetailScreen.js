import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import apiClient from '../services/apiClient';
import { AuthContext } from '../navigation/AuthProvider';

const THEME_BLUE = '#4a90e2'; // Primary blue
const TEXT_COLOR_PRIMARY = '#333333';
const TEXT_COLOR_SECONDARY = '#555555';
const TEXT_COLOR_LABEL = '#777777';
const BORDER_COLOR = '#DDDDDD';
const BACKGROUND_COLOR_LIGHT = '#F4F6F8'; // Light background for the screen
const WHITE_COLOR = '#FFFFFF';

const BorrowDetailScreen = () => {
  const route = useRoute();
  const { borrowingId } = route.params;

  const [borrowingDetails, setBorrowingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext); //

  useEffect(() => {
    const fetchDetails = async () => {
      if (!borrowingId) {
        setError('Borrowing ID is missing.'); setLoading(false); return;
      }
      try {
        setLoading(true);
        const response = await apiClient.get(`/api/borrowings/${borrowingId}/`);
        setBorrowingDetails(response.data);
        setError(null);
      } catch (e) {
        console.error('Failed to fetch borrowing details:', e.response?.data || e.message);
        setError('Failed to load borrowing details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [borrowingId]);

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) { return dateString; }
  };

  const renderAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'N/A';
    return authors.map(author => author.name).join(', ');
  };

  const getStatusDisplay = (statusKey) => {
    const statusMap = {
      'REQUESTED': 'Requested', 'ACTIVE': 'On Loan', 'RETURNED': 'Returned',
      'RETURNED_LATE': 'Returned Late', 'OVERDUE': 'Overdue', 'REJECTED': 'Rejected',
      'CANCELLED': 'Cancelled', 'LOST_BY_BORROWER': 'Lost', 'PENDING_RETURN': 'Pending Return',
    };
    return statusMap[statusKey] || statusKey.replace('_', ' ');
  };
  
  const DetailRow = ({ label, value, valueStyle }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, valueStyle]}>{value || 'N/A'}</Text>
    </View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={THEME_BLUE} /></View>;
  }
  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
  }
  if (!borrowingDetails) {
    return <View style={styles.centered}><Text>No details available.</Text></View>;
  }

  const {
    status, request_date, issue_date, due_date, return_date,
    borrower, book_copy,
  } = borrowingDetails;
  const book = book_copy?.book;

  return (
    <ScrollView style={styles.container}>
      {book?.cover_image && (
        <Image source={{ uri: book.cover_image }} style={styles.coverImage} resizeMode="contain" />
      )}
      
      <View style={styles.section}>
        <Text style={styles.bookTitle}>{book?.title || 'Book Title Not Available'}</Text>
        <Text style={styles.bookAuthors}>by {renderAuthors(book?.authors)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Loan Details</Text>
        <DetailRow label="Status" value={getStatusDisplay(status)} valueStyle={getStatusStyle(status)} />
        <DetailRow label="Requested On" value={formatDate(request_date, true)} />
        {issue_date && <DetailRow label="Issued On" value={formatDate(issue_date, true)} />}
        <DetailRow label="Due Date" value={formatDate(due_date)} />
        {return_date && <DetailRow label={status === 'LOST_BY_BORROWER' ? 'Lost On' : 'Returned On'} value={formatDate(return_date, true)} />}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Book & Copy Information</Text>
        <DetailRow label="ISBN" value={book?.isbn} />
        <DetailRow label="Copy ID" value={book_copy?.copy_id} />
      </View>
      
    </ScrollView>
  );
};

const getStatusStyle = (statusKey) => { // Helper for dynamic status text color
  switch (statusKey) {
    case 'ACTIVE': case 'PENDING_RETURN': return { color: '#28a745' }; // Green
    case 'OVERDUE': return { color: '#dc3545' }; // Red
    case 'REQUESTED': return { color: '#ffc107' }; // Amber/Yellow
    case 'RETURNED': case 'RETURNED_LATE': return { color: THEME_BLUE }; // Blue
    case 'CANCELLED': case 'REJECTED': case 'LOST_BY_BORROWER': return { color: TEXT_COLOR_SECONDARY }; // Grayish
    default: return { color: TEXT_COLOR_PRIMARY };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR_LIGHT,
  },
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E0E0E0',
    marginBottom: 10,
  },
  section: {
    backgroundColor: WHITE_COLOR,
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY,
    marginBottom: 5,
    textAlign: 'center',
  },
  bookAuthors: {
    fontSize: 16,
    color: TEXT_COLOR_SECONDARY,
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_BLUE,
    marginBottom: 12,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: THEME_BLUE + '50', // Lighter blue for underline
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  detailLabel: {
    fontSize: 15,
    color: TEXT_COLOR_LABEL,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: TEXT_COLOR_PRIMARY,
    fontWeight: '500',
    flexShrink: 1, // Allow value to shrink if label is long
    textAlign: 'right',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: BACKGROUND_COLOR_LIGHT,
  },
  errorText: {
    color: '#dc3545', // Red
    fontSize: 16,
    textAlign: 'center',
  },
});

export default BorrowDetailScreen;