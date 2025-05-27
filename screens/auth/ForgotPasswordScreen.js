// LMS/Frontend/screens/auth/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // For back button icon, if needed
import apiClient from '../../services/apiClient'; // Adjust path if needed

// Define colors directly as per your preference to avoid colors.js
const THEME_BLUE = '#3b82f6'; // Using the blue from ProfileScreen's saveBtn
const WHITE = '#fff';
const INPUT_BG_COLOR = '#f8fafc';
const INPUT_BORDER_COLOR = '#cbd5e1';
const TEXT_COLOR_PRIMARY = '#1e293b';
const TEXT_LABEL_COLOR = '#475569';
const SCREEN_BG_COLOR = '#f4f6f8';
const ERROR_COLOR = '#ef4444'; // Red for errors
const SUCCESS_COLOR = '#10B981'; // Green for success messages

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordResetRequest = async () => {
    Keyboard.dismiss();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    // Basic email format validation (optional, as backend will validate too)
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // The endpoint for django-rest-passwordreset to request a token
      await apiClient.post('/api/auth/password_reset/', { email });
      
      setMessage(
        'If an account with that email exists, password reset instructions ' +
        'have been processed. For development, please check your Django console ' +
        'for the reset email content and link.'
      );
      setEmail(''); // Clear the input field on success
    } catch (err) {
      console.error('Password Reset Request Failed:', err.response?.data || err.message);
      if (err.response?.data && typeof err.response.data === 'object') {
        // django-rest-passwordreset might return a 200 OK even if email not found
        // if DJANGO_REST_PASSWORDRESET_NO_INFORMATION_ON_SUCCESS = True (default)
        // In this case, the success message is appropriate.
        // If it returns an error (e.g. 400 for malformed email, or if configured to show email not found errors)
        let errorDetail = 'An unexpected error occurred. Please try again.';
        if (err.response.data.email && Array.isArray(err.response.data.email)) {
            errorDetail = err.response.data.email.join(' ');
        } else if (typeof err.response.data.detail === 'string') {
            errorDetail = err.response.data.detail;
        } else {
            // Flatten other potential DRF error structures
             const errors = err.response.data;
             const errorMessages = Object.entries(errors).map(([key, value]) => {
                 if (Array.isArray(value)) {
                     return `${key}: ${value.join(', ')}`;
                 }
                 return `${key}: ${String(value)}`;
             });
             if (errorMessages.length > 0) {
                 errorDetail = errorMessages.join('\n');
             }
        }
        setError(errorDetail);
      } else {
        setError('Failed to request password reset. Please check your network and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={28} color={THEME_BLUE} />
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address below. If an account exists, instructions will be sent to the Django console (for development).
        </Text>

        {message && <Text style={styles.successMessage}>{message}</Text>}
        {error && <Text style={styles.errorMessage}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePasswordResetRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <Text style={styles.buttonText}>Send Reset Instructions</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SCREEN_BG_COLOR, // '#f4f6f8'
    paddingHorizontal: 24,
    justifyContent: 'center', // Center content vertically
  },
  backButton: {
    position: 'absolute',
    top: 30, // Adjust for status bar
    left: 20,
    padding: 10,
    zIndex: 10, // Ensure it's tappable
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY, // '#1e293b'
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_LABEL_COLOR, // '#475569'
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: INPUT_BORDER_COLOR, // '#cbd5e1'
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: INPUT_BG_COLOR, // '#f8fafc'
    color: TEXT_COLOR_PRIMARY, // '#1e293b'
    marginBottom: 20,
  },
  button: {
    backgroundColor: THEME_BLUE, // '#3b82f6'
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd', // Lighter blue
  },
  buttonText: {
    color: WHITE, // '#fff'
    fontSize: 16,
    fontWeight: '600',
  },
  successMessage: {
    color: SUCCESS_COLOR, // Green
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: SUCCESS_COLOR + '20', // Light green background
    borderRadius: 6,
  },
  errorMessage: {
    color: ERROR_COLOR, // Red
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: ERROR_COLOR + '15', // Light red background
    borderRadius: 6,
  },
});

export default ForgotPasswordScreen;