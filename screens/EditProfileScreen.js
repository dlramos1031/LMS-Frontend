// LMS/Frontend/screens/EditProfileScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../services/apiClient';
import { AuthContext } from '../navigation/AuthProvider'; //

const THEME_BLUE = '#3b82f6'; // From your ProfileScreen saveBtn
const WHITE = '#fff';
const INPUT_BG_COLOR = '#f8fafc'; // From your ProfileScreen input
const INPUT_BORDER_COLOR = '#cbd5e1'; // From your ProfileScreen input
const TEXT_COLOR_PRIMARY = '#1e293b'; // From your ProfileScreen input text
const TEXT_LABEL_COLOR = '#475569'; // From your ProfileScreen label
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=User';
const SCREEN_BG_COLOR = '#f8fafc'; // From your ProfileScreen container

export default function EditProfileScreen({ route, navigation }) {
  const { currentUserData } = route.params;
  const insets = useSafeAreaInsets();
  const { user: contextUser, setUser: setContextUser, token } = useContext(AuthContext); // Assuming setUser updates context

  const [firstName, setFirstName] = useState(currentUserData?.first_name || '');
  const [lastName, setLastName] = useState(currentUserData?.last_name || '');
  const [middleInitial, setMiddleInitial] = useState(currentUserData?.middle_initial || '');
  const [suffix, setSuffix] = useState(currentUserData?.suffix || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUserData?.phone_number || '');
  const [physicalAddress, setPhysicalAddress] = useState(currentUserData?.physical_address || '');
  const [birthDate, setBirthDate] = useState(currentUserData?.birth_date || ''); // Consider a date picker for this
  const [profileImageUri, setProfileImageUri] = useState(currentUserData?.profile_picture || null); // For display
  const [newProfileImage, setNewProfileImage] = useState(null); // For new image file { uri, type, name }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Request media library permissions when the component mounts
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to allow profile picture uploads.');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile pics
      quality: 0.7,
    });

    if (!result.canceled) {
      const imageAsset = result.assets[0];
      setProfileImageUri(imageAsset.uri); // Update preview
      // Prepare file object for FormData
      let filename = imageAsset.uri.split('/').pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      // For web, result.assets[0].blob or result.assets[0].file might be available
      // For mobile, we send the uri, name, type object
      setNewProfileImage({ uri: imageAsset.uri, name: filename, type });
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError(null);

    const formData = new FormData();
    // Append fields that have changed or are always sent
    // Ensure your backend UserSerializer handles these fields correctly
    if (firstName !== currentUserData?.first_name) formData.append('first_name', firstName);
    if (lastName !== currentUserData?.last_name) formData.append('last_name', lastName);
    if (middleInitial !== (currentUserData?.middle_initial || '')) formData.append('middle_initial', middleInitial);
    if (suffix !== (currentUserData?.suffix || '')) formData.append('suffix', suffix);
    if (phoneNumber !== (currentUserData?.phone_number || '')) formData.append('phone_number', phoneNumber);
    if (physicalAddress !== (currentUserData?.physical_address || '')) formData.append('physical_address', physicalAddress);
    if (birthDate !== (currentUserData?.birth_date || '')) { // Handle date format if needed by backend
        formData.append('birth_date', birthDate); // Ensure YYYY-MM-DD format if backend expects it
    }


    if (newProfileImage) {
      formData.append('profile_picture', newProfileImage);
    }
    
    // Check if any data is actually being sent
    // FormData._parts is an internal detail, better to track changes explicitly if possible
    // For simplicity, we'll send the request if any field could have changed or image is new.
    // Or, build formData only with explicitly changed fields.

    try {
      const response = await apiClient.patch('/api/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Crucial for file uploads
        },
      });

      if (response.data) {
        Alert.alert('Success', 'Profile updated successfully!');
        if (setContextUser) { // Update user in AuthContext
          setContextUser(prevUser => ({ ...prevUser, ...response.data }));
        }
        navigation.goBack(); // Go back to ProfileScreen
      }
    } catch (err) {
      console.error("Failed to update profile:", err.response?.data || err.message);
      let errorMessage = 'Could not update profile. ';
      if (err.response?.data) {
          const errors = err.response.data;
          // Flatten DRF errors
          const errorMessages = Object.entries(errors).map(([key, value]) => {
              if (Array.isArray(value)) {
                  return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${String(value)}`; // Handle non-array errors
          });
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: profileImageUri || PLACEHOLDER_IMAGE }}
            style={styles.profileImageActual}
          />
          <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={20} color={THEME_BLUE} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorTextDisplay}>{error}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Enter first name"/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Enter last name"/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Initial</Text>
            <TextInput style={styles.input} value={middleInitial} onChangeText={setMiddleInitial} placeholder="M.I."/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Suffix</Text>
            <TextInput style={styles.input} value={suffix} onChangeText={setSuffix} placeholder="e.g., Jr., Sr."/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter phone number" keyboardType="phone-pad"/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Physical Address</Text>
            <TextInput style={styles.input} value={physicalAddress} onChangeText={setPhysicalAddress} placeholder="Enter address" multiline/>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD"/>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.buttonDisabled]} onPress={handleSaveChanges} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Styles adapted from your ProfileScreen.js, with additions for this form
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG_COLOR, // '#f8fafc'
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20, // Reduced from 30
  },
  profileImageActual: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e2e8f0',
    borderWidth: 3,
    borderColor: THEME_BLUE, // '#3b82f6'
    marginBottom: 10,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: INPUT_BG_COLOR, // '#f8fafc',
    borderWidth: 1,
    borderColor: INPUT_BORDER_COLOR, // '#cbd5e1'
  },
  changePhotoText: {
    marginLeft: 8,
    color: THEME_BLUE, // '#3b82f6'
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
    backgroundColor: WHITE, // '#ffffff'
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155', // From your ProfileScreen
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // From your ProfileScreen
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_LABEL_COLOR, // '#475569'
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: INPUT_BORDER_COLOR, // '#cbd5e1'
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15, // Added horizontal padding for better text input
    fontSize: 16,
    backgroundColor: INPUT_BG_COLOR, // '#f8fafc'
    color: TEXT_COLOR_PRIMARY, // '#1e293b'
  },
  saveBtn: {
    backgroundColor: THEME_BLUE, // '#3b82f6'
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10, // Reduced from 20
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveText: {
    color: WHITE, // '#fff'
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd', // Lighter blue from your ProfileScreen
  },
  errorTextDisplay: {
    textAlign: 'center',
    color: '#d9534f', // Error text color
    fontSize: 14,
    marginVertical: 10, // Added margin
  },
});