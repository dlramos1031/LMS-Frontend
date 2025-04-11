import React, { useEffect, useState } from 'react';
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
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({ name: '', idNumber: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({ ...docSnap.data(), email: user.email });
        }
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!profile.name || !profile.idNumber) {
      Alert.alert('Validation Error', 'Please enter all fields');
      return;
    }

    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        name: profile.name,
        idNumber: profile.idNumber,
      });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
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
            placeholder="Enter your student ID"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email (read-only)</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={profile.email}
            editable={false}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Actions */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 50,
    backgroundColor: '#1b263b',
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
    backgroundColor: '#415a77',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#778da9',
    position: 'relative',
  },
  editIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 4,
  },
  avatarEmoji: {
    fontSize: 42,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#cbd5e1',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#778da9',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  disabledInput: {
    backgroundColor: '#e2e8f0',
    color: '#64748b',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#94a3b8',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    gap: 10,
  },
  secondaryText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    justifyContent: 'center',
    gap: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
