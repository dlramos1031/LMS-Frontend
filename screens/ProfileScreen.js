// Frontend/screens/ProfileScreen.js

import React, { useEffect, useState, useContext, useCallback } // Added useCallback
from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import hook
import { AuthContext } from '../navigation/AuthProvider'; // Import AuthContext
import apiClient from '../services/apiClient'; // Import apiClient

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const { user: contextUser, logout } = useContext(AuthContext); // Get user from context and logout function

  // Initialize profile state potentially from context, then update from API
  const [profile, setProfile] = useState({
    username: contextUser?.username || '',
    full_name: contextUser?.full_name || '',
    email: contextUser?.email || '',
    // idNumber: '', // Add if you implement idNumber in backend/serializer
  });
  const [loading, setLoading] = useState(true); // Loading state for initial fetch
  const [saving, setSaving] = useState(false); // Saving state for profile update
  const [error, setError] = useState(null); // Error state

  // Fetch Profile Data from API
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching profile from /api/profile/");
      const response = await apiClient.get('/auth/profile/'); // Use the correct API endpoint
      if (response.data) {
        setProfile(response.data); // Update state with data from API
        console.log("Profile data fetched:", response.data);
        // Optionally update AuthContext user state here if needed
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err.response || err);
      setError("Could not load profile data.");
      // Keep potentially existing context data on error
      setProfile(prev => ({
          ...prev, // Keep existing data
          username: prev.username || contextUser?.username || '',
          full_name: prev.full_name || contextUser?.full_name || '',
          email: prev.email || contextUser?.email || '',
      }));
    } finally {
      setLoading(false);
    }
  }, [contextUser]); // Re-fetch if contextUser changes (e.g., after re-login)

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]); // Fetch on mount and when fetchUserProfile changes


  // Handle Saving Profile Data
  const handleSave = async () => {
    if (!profile.full_name) { // Basic validation
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    setSaving(true);
    setError(null);
    // Prepare only the data that should be updated via API
    // Based on UserProfileSerializer read_only_fields: only 'full_name'
    // Add other fields like 'idNumber' if you implemented them in the backend API
    const dataToSave = {
      full_name: profile.full_name,
    };

    try {
      console.log("Updating profile to /api/profile/ with data:", dataToSave);
      const response = await apiClient.patch('/auth/profile/', dataToSave);
      setProfile(response.data); // Update profile state with response
       // Optionally update user in AuthContext here if needed
      Alert.alert('Success', 'Profile updated successfully');
      console.log("Profile update successful:", response.data);
    } catch (err) {
       console.error("Failed to update profile:", err.response?.data || err);
       let errorMessage = 'Could not update profile.';
        if (err.response?.data) {
            const errors = err.response.data;
            const errorMessages = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`);
             if (errorMessages.length > 0) {
                errorMessage = errorMessages.join('\n');
            } else if (errors.detail) {
                 errorMessage = errors.detail;
            }
        }
        setError(errorMessage);
        Alert.alert('Update Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Logout Error', 'An error occurred during logout.');
      console.error('Logout error in ProfileScreen:', error);
    }
  };


  // Render loading indicator
  if (loading) {
    return (
        <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
             <ActivityIndicator size="large" color="#1976d2" />
        </View>
    );
  }

  return (
    // Apply safe area padding to the root View
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Avatar Section - Placeholder remains */}
        <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={() => Alert.alert('Profile picture feature coming soon')}>
            <View style={styles.avatarMock}>
                <Text style={styles.avatarEmoji}>👤</Text>
                <View style={styles.editIcon}>
                <Ionicons name="camera" size={16} color="#fff" />
                </View>
            </View>
            </TouchableOpacity>
            {/* Display username from profile state */}
            <Text style={styles.username}>{profile.username || 'User'}</Text>
        </View>

        {/* Display error message if fetch/save failed */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Form Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                  style={styles.input}
                  value={profile.full_name} // Use profile state
                  onChangeText={(text) => setProfile({ ...profile, full_name: text })} // Update local state
                  placeholder="Enter your full name"
                  placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username (read-only)</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]} 
                value={profile.username}
                editable={false} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (read-only)</Text>
              <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={profile.email} // Use profile state
                  editable={false}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={[styles.saveBtn, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text> }
            </TouchableOpacity>
        </View>

        {/* Footer Actions */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            {/* Other buttons remain the same */}
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('About')}>
            <Ionicons name="information-circle-outline" size={18} color="#1e293b" />
            <Text style={styles.secondaryText}>About</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={18} color="#1e293b" />
            <Text style={styles.secondaryText}>Settings</Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    </View>
  );
}

// Styles (mostly same as before, added error text style)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40, // Add padding at the bottom
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 30, // Give vertical margin
    },
    avatarMock: { /* ... same ... */
        width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#cbd5e1', position: 'relative' },
    editIcon: { /* ... same ... */
        position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3b82f6', borderRadius: 12, padding: 5, borderWidth: 2, borderColor: '#f8fafc' },
    avatarEmoji: { /* ... same ... */
        fontSize: 42 },
    username: { /* ... same ... */
        fontSize: 22, fontWeight: '600', color: '#1e293b', marginTop: 12 },
    section: { /* ... same ... */
        marginBottom: 25, backgroundColor: '#ffffff', borderRadius: 12, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1, }, shadowOpacity: 0.05, shadowRadius: 2.22, elevation: 3, },
    sectionTitle: { /* ... same ... */
        fontSize: 18, fontWeight: '600', color: '#334155', marginBottom: 20, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', },
    inputGroup: { /* ... same ... */
        marginBottom: 18, },
    label: { /* ... same ... */
        fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 8, },
    input: { /* ... same ... */
        borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f8fafc', color: '#1e293b', },
    disabledInput: { /* ... same ... */
        backgroundColor: '#e2e8f0', color: '#64748b', },
    saveBtn: { /* ... same ... */
        backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center', minHeight: 48, },
    saveText: { /* ... same ... */
        color: '#fff', fontSize: 16, fontWeight: '600', },
    secondaryBtn: { /* ... same ... */
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 14, borderRadius: 8, marginTop: 12, gap: 12, borderWidth: 1, borderColor: '#e2e8f0', },
    secondaryText: { /* ... same ... */
        color: '#334155', fontSize: 15, fontWeight: '500', },
    logoutBtn: { /* ... same ... */
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingVertical: 14, borderRadius: 8, marginTop: 15, justifyContent: 'center', gap: 10, },
    logoutText: { /* ... same ... */
        color: '#fff', fontWeight: '600', fontSize: 16, },
    buttonDisabled: { /* ... same ... */
        backgroundColor: '#93c5fd', },
    errorText: { // Added style for errors
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    }
});