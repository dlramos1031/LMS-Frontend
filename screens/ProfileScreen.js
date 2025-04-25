// Frontend/screens/ProfileScreen.js

import React, { useEffect, useState, useContext } // Added useContext
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
// Removed: import { auth, db } from '../config/firebase';
// Removed: import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { AuthContext } from '../navigation/AuthProvider'; // Import AuthContext

// ---- TEMPORARY: Keep Firebase imports for profile data until Step 5 ----
import { auth, db } from '../config/firebase'; // Keep temporarily
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Keep temporarily
// ---- END TEMPORARY ----

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({ name: '', idNumber: '', email: '' });
  const [loading, setLoading] = useState(true); // Loading state for profile fetch
  const [saving, setSaving] = useState(false); // Saving state for profile update

  // Get logout function from AuthContext
  const { logout } = useContext(AuthContext); // Get logout from context

  // ---- TEMPORARY: useEffect still uses Firebase ----
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true); // Start loading
      const user = auth.currentUser; // Still uses Firebase auth temporarily
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // Use user.email from Firebase auth object, others from Firestore
            setProfile({ ...docSnap.data(), email: user.email || '' });
          } else {
             // Set email even if profile doc doesn't exist yet
             setProfile({ name: '', idNumber: '', email: user.email || '' });
          }
        } catch (error) {
            console.error("Error fetching profile:", error);
            // Set email even on error
            setProfile({ name: '', idNumber: '', email: user.email || '' });
        }
      }
      setLoading(false); // Finish loading
    };

    fetchUserProfile();
  }, []);
  // ---- END TEMPORARY ----


  // ---- TEMPORARY: handleSave still uses Firebase ----
  const handleSave = async () => {
    const user = auth.currentUser; // Still uses Firebase auth temporarily
    if (!user) return; // Make sure user is available

    if (!profile.name) { // Simplified validation
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.uid);
      // Prepare data, excluding email as it's not editable here
      const dataToSave = {
          name: profile.name,
          idNumber: profile.idNumber || '', // Save idNumber or empty string
      };
      await updateDoc(docRef, dataToSave); // Consider using setDoc with merge:true if doc might not exist
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };
  // ---- END TEMPORARY ----

  // Updated handleLogout function
  const handleLogout = async () => {
    try {
      await logout(); // Call logout from AuthContext
      // Navigation is handled by RootNavigator automatically
    } catch (error) {
      // AuthProvider's logout function already logs errors,
      // but you could add specific UI feedback here if needed.
      Alert.alert('Logout Error', 'An error occurred during logout.');
      console.error('Logout error in ProfileScreen:', error);
    }
  };


  if (loading && !profile.email) { // Show loader only on initial load without data
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
         {/* Avatar rendering remains the same */}
         <TouchableOpacity onPress={() => Alert.alert('Profile picture feature coming soon')}>
          <View style={styles.avatarMock}>
            <Text style={styles.avatarEmoji}>👤</Text>
            <View style={styles.editIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.username}>{profile.name || 'User'}</Text>
      </View>

      {/* Form Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Info</Text>

        {/* Inputs remain the same for now */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(text) => setProfile({ ...profile, name: text })}
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ID Number</Text>
          <TextInput
            style={styles.input}
            value={profile.idNumber}
            onChangeText={(text) => setProfile({ ...profile, idNumber: text })}
            placeholder="Enter your student ID (Optional)" // Marked as optional
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (read-only)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={profile.email} // Display email from state
            editable={false}
          />
        </View>

        {/* Save button remains the same for now */}
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

        {/* Updated Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Styles remain largely the same, added disabled style for save button
const styles = StyleSheet.create({
  container: {
    paddingVertical: 40, // Adjusted padding
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc', // Slightly lighter background
    flexGrow: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarMock: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e2e8f0', // Lighter background for mock
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#cbd5e1', // Lighter border
    position: 'relative',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0, // Adjusted position
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 12, // Make it rounder
    padding: 5,
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  avatarEmoji: {
    fontSize: 42,
  },
  username: {
    fontSize: 22, // Larger username
    fontWeight: '600',
    color: '#1e293b', // Darker text
    marginTop: 12,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#ffffff', // Add background to sections
    borderRadius: 12,
    padding: 20,
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
    fontWeight: '600', // Slightly less bold
    color: '#334155', // Adjusted color
    marginBottom: 20, // More space after title
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  inputGroup: {
    marginBottom: 18, // More space between inputs
  },
  label: {
    fontSize: 14, // Slightly smaller label
    fontWeight: '500', // Medium weight
    color: '#475569', // Adjusted color
    marginBottom: 8, // More space after label
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1', // Lighter border
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  disabledInput: {
    backgroundColor: '#e2e8f0', // Different background for disabled
    color: '#64748b',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14, // Adjusted padding
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row', // For loader alignment
    justifyContent: 'center',
    minHeight: 48,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600', // Bold text
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9', // Lighter background for secondary buttons
    padding: 14,
    borderRadius: 8,
    marginTop: 12, // More space
    gap: 12, // More gap
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryText: {
    color: '#334155', // Darker text
    fontSize: 15,
    fontWeight: '500', // Medium weight
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
   buttonDisabled: { // Style for disabled save button
    backgroundColor: '#93c5fd', // Lighter blue
  },
});