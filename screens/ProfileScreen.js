// Frontend/screens/ProfileScreen.js
// Your existing imports
import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  // TextInput, // Will change some TextInputs to Text for display-only
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image, // Added for Profile Picture
  RefreshControl // Added for pull-to-refresh
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../navigation/AuthProvider';
import apiClient from '../services/apiClient';

// Using a placeholder image URL
const DEFAULT_PROFILE_PIC = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user: contextUser, logout, setAuthenticationState } = useContext(AuthContext); // Assuming setAuthenticationState can refresh context user

  // Initialize profile state with more fields, potentially from context or defaults
  const [profile, setProfile] = useState({
    username: contextUser?.username || '',
    full_name: contextUser?.full_name || '', // This will be updated from API
    first_name: contextUser?.first_name || '',
    last_name: contextUser?.last_name || '',
    email: contextUser?.email || '',
    profile_picture: contextUser?.profile_picture || null,
    phone_number: contextUser?.phone_number || '',
    physical_address: contextUser?.physical_address || '',
    birth_date: contextUser?.birth_date || null,
    borrower_id_value: contextUser?.borrower_id_value || '', // Assuming this field name from UserSerializer
    borrower_id_label: contextUser?.borrower_id_label || 'Borrower ID',
    borrower_type: contextUser?.borrower_type || '',
    date_joined: contextUser?.date_joined || null,
    // Add any other fields you expect from UserSerializer
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh
  const [error, setError] = useState(null);

  // Fetch Profile Data from API
  const fetchUserProfile = useCallback(async () => {
    setError(null);
    try {
      // console.log("Fetching profile from /api/auth/profile/");
      const response = await apiClient.get('/api/auth/profile/'); // Correct endpoint
      if (response.data) {
        setProfile(response.data);
        // console.log("Profile data fetched:", response.data);
        // Optionally update AuthContext user state here if needed and if a function is provided
        if (setAuthenticationState) { // If your AuthProvider has a way to update the context user
             setAuthenticationState(prev => ({...prev, user: response.data}));
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err.response?.data || err.message);
      let errorMessage = "Could not load profile data. ";
      if (err.response?.status === 401) {
          errorMessage += "Please log in again."
      } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
      }
      setError(errorMessage);
      // Keep potentially existing context data on error if profile state is not fully overwritten
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setAuthenticationState]); // Add dependencies if they are used inside

  useEffect(() => {
    setLoading(true); // Set loading true on initial mount
    fetchUserProfile();
  }, [fetchUserProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { currentUserData: profile });
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              await logout(); // Call logout from AuthContext
              // Navigation to login screen is handled by RootNavigator based on user/token state
            } catch (error) {
              Alert.alert('Logout Error', 'An error occurred during logout.');
              console.error('Logout error in ProfileScreen:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  // Helper to display profile information items
  const InfoItem = ({ label, value, iconName }) => (
    <View style={styles.infoItemContainer}>
      {iconName && <Ionicons name={iconName} size={20} color="#475569" style={styles.infoIcon} />}
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value || 'N/A'}</Text>
    </View>
  );


  if (loading && !profile.username) { // Show loader if profile is not yet populated
    return (
        <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
             <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]}/>}
        >
        <View style={styles.avatarContainer}>
            <Image 
                source={{ uri: profile.profile_picture || DEFAULT_PROFILE_PIC }} 
                style={styles.profileImageActual} // New style for actual image
            />
            <Text style={styles.username}>
              {profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'User'}
            </Text>
            <Text style={styles.profileSubtext}>@{profile.username || 'username'}</Text>
            <Text style={styles.profileSubtext}>{profile.email || 'email@example.com'}</Text>
        </View>

        {error && !loading && ( // Show error only if not loading and error exists
            <View style={styles.errorContainer}>
                <Text style={styles.errorTextDisplay}>{error}</Text>
            </View>
         )}

        {/* Profile Info Section - Display only */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <InfoItem iconName="person-outline" label="Full Name" value={profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim()} />
            <InfoItem iconName="mail-outline" label="Email" value={profile.email} />
            <InfoItem iconName="call-outline" label="Phone Number" value={profile.phone_number} />
            <InfoItem iconName="home-outline" label="Address" value={profile.physical_address} />
            <InfoItem iconName="calendar-outline" label="Birth Date" value={profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'N/A'} />
        </View>
        
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Library Details</Text>
            <InfoItem iconName="id-card-outline" label={profile.borrower_id_label || "Borrower ID"} value={profile.borrower_id_value} />
            <InfoItem iconName="library-outline" label="Borrower Type" value={profile.borrower_type} />
            <InfoItem iconName="enter-outline" label="Date Joined" value={profile.date_joined ? new Date(profile.date_joined).toLocaleDateString() : 'N/A'} />
        </View>

        {/* Edit Profile Button - Replaces Save Changes */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleEditProfile}> 
          <Ionicons name="pencil-outline" size={20} color="#fff" style={{marginRight: 10}} />
          <Text style={styles.saveText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Footer Actions - Kept as per your original structure */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('About')}>
              <Ionicons name="information-circle-outline" size={18} color="#1e293b" />
              <Text style={styles.secondaryText}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={18} color="#1e293b" />
              <Text style={styles.secondaryText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    </View>
  );
}

// YOUR EXISTING STYLES (with minor additions/tweaks for new elements)
// I've tried to match the color values from your provided CSS for new elements like InfoItem
const styles = StyleSheet.create({ // Styles from your uploaded ProfileScreen.js
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Your background color
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40, 
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 30, 
    },
    // Original avatarMock related styles (editIcon, avatarEmoji) are removed as we use a real image.
    profileImageActual: { // New style for the actual profile image
        width: 120,
        height: 120,
        borderRadius: 60, // Circular image
        backgroundColor: '#e2e8f0', // Placeholder background
        borderWidth: 3,
        borderColor: '#3b82f6', // Your blue color for border
        marginBottom: 10,
    },
    username: { 
      fontSize: 22, 
      fontWeight: '600', 
      color: '#1e293b', // Your text color
      marginTop: 12,
      textAlign: 'center',
    },
    profileSubtext: { // Added for email/username below name
        fontSize: 14,
        color: '#64748b', // Your secondary text color
        textAlign: 'center',
    },
    section: { 
      marginBottom: 25, 
      backgroundColor: '#ffffff', 
      borderRadius: 12, 
      padding: 20, 
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 1, }, 
      shadowOpacity: 0.05, 
      shadowRadius: 2.22, 
      elevation: 3, 
    },
    sectionTitle: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: '#334155', 
      marginBottom: 10, // Reduced margin slightly
      paddingBottom: 8, // Added padding
      borderBottomWidth: 1, 
      borderBottomColor: '#e2e8f0', 
    },
    // InfoItem styles (replaces inputGroup for display)
    infoItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0', // Light border for items
    },
    infoIcon: {
        marginRight: 12,
    },
    label: { // Reused for InfoItem label
      fontSize: 14, 
      fontWeight: '500', 
      color: '#475569', 
      width: 120, // Fixed width for labels for alignment
    },
    infoValue: { // For displaying profile values
      fontSize: 14,
      color: '#1e293b', // Your primary text color
      flex: 1, // Take remaining space
      textAlign: 'left',
    },
    // inputGroup, input, disabledInput are removed as inline editing is removed for this screen
    saveBtn: { // This style is now used for "Edit Profile" button
      backgroundColor: '#3b82f6', // Your blue color
      paddingVertical: 14, 
      borderRadius: 8, 
      alignItems: 'center', 
      marginVertical: 20,
      flexDirection: 'row', 
      justifyContent: 'center', 
      minHeight: 48, 
    },
    saveText: { // For "Edit Profile" button text
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '600', 
    },
    secondaryBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#f1f5f9', 
      padding: 14, 
      borderRadius: 8, 
      marginTop: 12, 
      gap: 12, 
      borderWidth: 1, 
      borderColor: '#e2e8f0', 
    },
    secondaryText: { 
      color: '#334155', 
      fontSize: 15, 
      fontWeight: '500', 
    },
    logoutBtn: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: '#ef4444', 
      paddingVertical: 14, 
      borderRadius: 8, 
      marginTop: 15, 
      justifyContent: 'center', 
      gap: 10, 
    },
    logoutText: { 
      color: '#fff', 
      fontWeight: '600', 
      fontSize: 16, 
    },
    // buttonDisabled is removed as saving state is removed for this screen
    errorContainer: { // Your existing style
      backgroundColor: '#fff0f0', // Light red for error background
      padding: 15,
      marginHorizontal: 0, // Adjusted to be full width within scroll content padding
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15, // Space below error message
    },
    errorTextDisplay: { // Renamed from errorText to avoid conflict if you add specific error styling later
      textAlign: 'center',
      color: '#d9534f', // Your error text color
      fontSize: 14,
    },
    // retryButton, retryButtonText are removed as error handling is simplified to display message
    // loader style is kept for the main loading indicator
    loader: { 
      marginTop: 50,
    },
    emptyContainer: { // Your existing style
      alignItems: 'center',
      marginTop: 50,
      paddingHorizontal: 20,
    },
    emptyText: { // Your existing style
      textAlign: 'center',
      fontSize: 16,
      color: '#888',
    }
});