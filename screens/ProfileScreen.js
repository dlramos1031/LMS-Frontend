// LMS/Frontend/screens/ProfileScreen.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // For icons
import apiClient from '../services/apiClient'; //
import { AuthContext } from '../navigation/AuthProvider'; //

// Define theme colors directly as colors.js is to be avoided
const THEME_BLUE = '#4a90e2'; // Example blue, adjust if needed
const TEXT_PRIMARY = '#333333';
const TEXT_SECONDARY = '#555555';
const TEXT_LABEL = '#777777';
const BACKGROUND_COLOR = '#F4F6F8';
const WHITE = '#FFFFFF';
const BORDER_COLOR = '#E0E0E0';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Image';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user: authContextUser, token, logout } = useContext(AuthContext); // Get user from AuthContext for initial display & token for fetch
  const [userData, setUserData] = useState(authContextUser); // Initialize with context data, then fetch
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const response = await apiClient.get('/api/auth/profile/');
      setUserData(response.data);
      setError(null);
    } catch (e) {
      console.error("Failed to fetch profile data:", e.response?.data || e.message);
      setError("Could not load profile. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect( // Refetch when screen comes into focus
    useCallback(() => {
      setLoading(true);
      fetchProfileData();
    }, [fetchProfileData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData();
  }, [fetchProfileData]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { currentUserData: userData });
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => logout(), style: "destructive" }
      ]
    );
  };

  const InfoRow = ({ iconName, label, value }) => (
    <View style={styles.infoRow}>
      {iconName && <Ionicons name={iconName} size={20} color={TEXT_LABEL} style={styles.infoIcon} />}
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value || 'N/A'}</Text>
    </View>
  );

  if (loading && !userData) { // Show loader only if no data is displayed yet
    return <View style={styles.centered}><ActivityIndicator size="large" color={THEME_BLUE} /></View>;
  }

  if (error && !userData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchProfileData}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!userData) {
    return <View style={styles.centered}><Text>No profile data available.</Text></View>;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME_BLUE]}/>}
    >
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: userData.profile_picture || PLACEHOLDER_IMAGE }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'}</Text>
        <Text style={styles.profileUsername}>@{userData.username || 'N/A'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <InfoRow iconName="mail-outline" label="Email" value={userData.email} />
        <InfoRow iconName="calendar-outline" label="Date of Birth" value={userData.birth_date ? new Date(userData.birth_date).toLocaleDateString() : 'N/A'} />
        <InfoRow iconName="call-outline" label="Phone" value={userData.phone_number} />
        <InfoRow iconName="home-outline" label="Address" value={userData.physical_address} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Library Details</Text>
        <InfoRow iconName="id-card-outline" label={userData.borrower_id_label || 'Borrower ID'} value={userData.borrower_id_value} />
        <InfoRow iconName="library-outline" label="Borrower Type" value={userData.borrower_type} />
        <InfoRow iconName="enter-outline" label="Joined On" value={userData.date_joined ? new Date(userData.date_joined).toLocaleDateString() : 'N/A'} />
        <InfoRow iconName="time-outline" label="Last Login" value={userData.last_login ? new Date(userData.last_login).toLocaleString() : 'N/A'} />
      </View>
      
      <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEditProfile}>
        <Ionicons name="pencil-outline" size={20} color={WHITE} style={{marginRight: 10}} />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={WHITE} style={{marginRight: 10}}/>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: BACKGROUND_COLOR,
  },
  errorText: {
    color: '#D9534F', // Standard error red
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  profileHeader: {
    backgroundColor: WHITE,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60, // Makes it circular
    borderWidth: 3,
    borderColor: THEME_BLUE,
    marginBottom: 15,
    backgroundColor: '#E0E0E0', // Placeholder background
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    marginBottom: 5,
  },
  profileUsername: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    marginBottom: 5,
  },
  section: {
    backgroundColor: WHITE,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME_BLUE,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR + '60', // Lighter border for rows
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 15,
    color: TEXT_LABEL,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    color: TEXT_PRIMARY,
    flex: 2, // Allow more space for value
    textAlign: 'right',
  },
  button: {
    backgroundColor: THEME_BLUE,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editButton: {
    // Specific styles if different from generic button
  },
  logoutButton: {
    backgroundColor: '#D9534F', // A standard red for logout/destructive actions
  },
  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;