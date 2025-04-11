import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebase';
import BookCarousel from '../components/BookCarousel';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (uid) {
          const docRef = doc(db, 'users', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserName(docSnap.data().name || '');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user name:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserName();
  }, []);

  const handleBookPress = (book) => {
    navigation.navigate('BookDetailsScreen', { book });
  };

  if (loadingUser) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Welcome back, <Text style={styles.name}>{userName}</Text> 👋</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books, authors, or genres"
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#aaa"
          />
        </View>

        {search.trim().length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>
              <Ionicons name="search" size={18} /> Search Results
            </Text>
            <BookCarousel
              filter="search"
              queryText={search.trim().toLowerCase()}
              onBookPress={handleBookPress}
            />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.heading}>
                <MaterialCommunityIcons name="star-outline" size={18} color="#555" /> Recommended
              </Text>
              <BookCarousel
                filter="recommended"
                onBookPress={handleBookPress}
              />
            </View>

            <GenreSection icon="book-open-page-variant" label="Comics" query="comics" onBookPress={handleBookPress} />
            <GenreSection icon="school-outline" label="Educational" query="educational" onBookPress={handleBookPress} />
            <GenreSection icon="feather" label="Fictions" query="fictions" onBookPress={handleBookPress} />
            <GenreSection icon="magnify" label="Mystery" query="mystery" onBookPress={handleBookPress} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function GenreSection({ icon, label, query, onBookPress }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>
        <MaterialCommunityIcons name={icon} size={18} color="#555" /> {label}
      </Text>
      <BookCarousel filter="genre" queryText={query} onBookPress={onBookPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  scroll: {
    padding: 16,
    paddingTop: 50,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  name: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  section: {
    marginBottom: 32,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
});
