import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../navigation/AuthProvider';
import apiClient from '../services/apiClient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ExpandableText from '../components/ExpandableText';

const DEFAULT_COVER = 'https://via.placeholder.com/300/CCCCCC/FFFFFF?text=No+Cover';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    return dateString;
  }
};

const DetailItem = ({ label, value, iconName, isExpandable = false }) => {
  let displayValue = value;
  if (value === null || typeof value === 'undefined' || value === '') {
    displayValue = 'N/A';
  } else if (Array.isArray(value)) {
    displayValue = value.length > 0 ? value.join(', ') : 'N/A';
  } else if (typeof value === 'number') {
    displayValue = value.toString();
  }


  return (
    <View style={styles.detailItemContainer}>
      {iconName && <MaterialCommunityIcons name={iconName} size={20} color="#4A5568" style={styles.detailIcon} />}
      <Text style={styles.label}>{label}:</Text>
      {isExpandable && typeof displayValue === 'string' && displayValue !== 'N/A' ? (
        <ExpandableText text={displayValue} style={styles.value} />
      ) : (
        <Text style={styles.value}>{displayValue}</Text>
      )}
    </View>
  );
};

export default function BookDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const initialBookData = route.params?.book;
  const [bookDetails, setBookDetails] = useState(initialBookData || null);
  const [borrowingInfo, setBorrowingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const bookIsbn = initialBookData?.isbn;

  const fetchAllBookData = useCallback(async () => {
    if (!bookIsbn) {
      setError("Book ISBN not found.");
      setIsLoading(false);
      if (!initialBookData) navigation.goBack();
      return;
    }

    setIsLoading(true);
    setError(null);
    setBorrowingInfo(null);

    try {
      const detailsResponse = await apiClient.get(`/api/books/${bookIsbn}/`);
      setBookDetails(detailsResponse.data);

      if (user?.id) {
        const borrowingStatusParams = {
          book_copy__book__isbn: bookIsbn,
          borrower: user.id,
          status__in: 'REQUESTED,ACTIVE,OVERDUE',
        };
        const borrowingResponse = await apiClient.get('/api/borrowings/', { params: borrowingStatusParams });
        if (borrowingResponse.data && Array.isArray(borrowingResponse.data) && borrowingResponse.data.length > 0) {
          setBorrowingInfo(borrowingResponse.data[0]);
        } else {
          setBorrowingInfo(null);
        }
      }
    } catch (err) {
      console.error('BookDetailsScreen: Failed to fetch book data:', err.response?.data || err.message, err);
      setError('Failed to load book details. Pull down to refresh.');
      if (!bookDetails && initialBookData) {
          setBookDetails(initialBookData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [bookIsbn, user?.id, initialBookData, navigation]);
  
  useFocusEffect(
    useCallback(() => {
      fetchAllBookData();
    }, [fetchAllBookData])
  );
  
  const handleCancelRequest = async () => {
    if (!borrowingInfo || borrowingInfo.status !== 'REQUESTED' || !borrowingInfo.id) {
      Alert.alert("Invalid Action", "This borrowing request cannot be cancelled or its ID is missing.");
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.post(`/api/borrowings/${borrowingInfo.id}/cancel-request/`);
      Alert.alert("Success", "Your borrow request has been cancelled.");
      fetchAllBookData(); 
    } catch (err) {
      console.error('Error cancelling request:', err.response?.data || err.message);
      Alert.alert("Cancellation Failed", err.response?.data?.detail || "Could not cancel the request.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const navigateToBorrowScreen = () => {
    if (!bookDetails || !bookDetails.isbn) {
      Alert.alert("Error", "Book details are not fully loaded. Cannot proceed.");
      return;
    }
    if (bookDetails.available_copies_count <= 0) {
      Alert.alert("Not Available", "No copies of this book are currently available to request.");
      return;
    }
    navigation.navigate('BorrowScreen', { 
        book: bookDetails
    });
  };

  const renderActionButton = () => {
    if (isLoading && !bookDetails) return null;
    if (isActionLoading) {
      return <ActivityIndicator size="small" color="#1976d2" style={styles.actionButtonActivity} />;
    }

    const currentAvailableCopies = bookDetails?.available_copies_count || 0;

    if (borrowingInfo) {
      if (borrowingInfo.status === 'REQUESTED') {
        return (
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={handleCancelRequest}>
            <MaterialCommunityIcons name="cancel" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        );
      } else if (['ACTIVE', 'OVERDUE'].includes(borrowingInfo.status)) {
        return (
          <View style={[styles.actionButton, styles.infoButtonDisabled]}>
            <MaterialCommunityIcons name="book-clock" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Loan Active (Due: {formatDate(borrowingInfo.due_date)})</Text>
          </View>
        );
      }
    } else if (currentAvailableCopies > 0) {
      return (
        <TouchableOpacity style={[styles.actionButton, styles.requestButton]} onPress={navigateToBorrowScreen}>
          <MaterialCommunityIcons name="book-plus-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Request to Borrow</Text>
        </TouchableOpacity>
      );
    } else if (currentAvailableCopies === 0) {
      return (
        <View style={[styles.actionButton, styles.infoButtonDisabled]}>
           <MaterialCommunityIcons name="information-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>No Copies Available</Text>
        </View>
      );
    }
    return null; 
  };
  
  if (isLoading && !initialBookData) { 
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  if (error && !bookDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchAllBookData} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!bookDetails && !isLoading) {
      return (
          <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Book data could not be loaded. Please go back and try again.</Text>
          </View>
      );
  }

  const displayData = bookDetails || initialBookData;
  const coverImageUri = displayData?.cover_image || DEFAULT_COVER;

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAllBookData} />}
      >
        {displayData ? (
          <>
            <View style={styles.headerSection}>
              <Image 
                source={{ uri: coverImageUri }} 
                style={styles.coverImage} 
                onError={(e) => console.log("Image load error:", e.nativeEvent.error, "URI:", coverImageUri)}
              />
              <Text style={styles.title}>{displayData.title || 'Title Not Available'}</Text>
              <Text style={styles.authors}>
                by {displayData.authors?.map(author => author.name).join(', ') || 'Unknown Author'}
              </Text>
            </View>

            {error && <Text style={styles.errorTextSmall}>{error}</Text>}

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Book Information</Text>
              <DetailItem label="ISBN" value={displayData.isbn} iconName="barcode-scan" />
              <DetailItem label="Publisher" value={displayData.publisher} iconName="office-building" />
              <DetailItem label="Published" value={formatDate(displayData.publication_date)} iconName="calendar-month" />
              <DetailItem label="Edition" value={displayData.edition} iconName="book-edit-outline" />
              <DetailItem label="Pages" value={displayData.page_count} iconName="book-open-page-variant-outline" />
              <DetailItem 
                label="Categories" 
                value={displayData.categories?.map(cat => cat.name)} // Pass as array
                iconName="shape-outline" 
              />
              {/* available_copies_count comes from the BookSerializer directly */}
              <DetailItem label="Copies Available" value={displayData.available_copies_count} iconName="check-circle-outline" />
              <DetailItem label="Total Borrows" value={displayData.total_borrows} iconName="swap-horizontal-bold" />
            </View>
            
            {displayData.description && (
                <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <ExpandableText text={displayData.description} style={styles.summary} />
                </View>
            )}
          </>
        ) : (
          <View style={styles.loadingContainer}><Text>Loading book details...</Text></View>
        )}
        <View style={{ height: 80 }} /> 
      </ScrollView>
      <View style={styles.fixedActionContainer}>
        {renderActionButton()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  container: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6f9',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorTextSmall: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  coverImage: {
    width: 180,
    height: 270,
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#e0e0e0',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 5,
  },
  authors: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 10,
  },
  detailsSection: {
    marginTop: 15,
    marginHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 12,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  detailItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', 
    marginBottom: 10,
    paddingVertical: 2,
  },
  detailIcon: {
    marginRight: 10,
    marginTop: Platform.OS === 'ios' ? 1 : 4, 
  },
  label: {
    fontWeight: '500',
    color: '#4A5568', 
    fontSize: 15,
    marginRight: 6,
    width: Platform.OS === 'ios' ? 120 : 110
  },
  value: {
    color: '#1E293B', 
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  summary: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155', 
  },
  fixedActionContainer: {
    paddingVertical: Platform.OS === 'ios' ? 20 : 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc', 
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 48,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  requestButton: {
    backgroundColor: '#1976d2', 
  },
  cancelButton: {
    backgroundColor: '#d32f2f', 
  },
  infoButtonDisabled: {
    backgroundColor: '#757575', 
    opacity: 0.8,
  },
  actionButtonActivity: {
    marginVertical: 10, 
  }
});