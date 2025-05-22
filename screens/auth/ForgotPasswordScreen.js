import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import apiClient from '../../services/apiClient'; 

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Local loading state

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the Django backend endpoint provided by django-rest-passwordreset
      const response = await apiClient.post('/api/auth/password_reset/', { email });

      // Check for successful response (django-rest-passwordreset usually returns 200 OK)
      if (response.status === 200) {
          Alert.alert(
            'Success',
            'If an account with that email exists, a password reset link has been sent.'
          );
          if (navigation.canGoBack()) {
            navigation.goBack(); // Go back to login screen
          }
      } else {
          // Handle unexpected successful status codes if necessary
           Alert.alert('Notice', response.data?.detail || 'Request processed.');
      }

    } catch (error) {
        // Handle errors (e.g., validation errors, server issues)
        let errorMessage = 'Failed to send reset link. Please try again.';
         if (error.response?.data) {
            const errors = error.response.data;
            // Extract specific field errors or detail message
             if (errors.email && Array.isArray(errors.email)) {
                 errorMessage = `Email: ${errors.email.join(', ')}`;
             } else if (errors.detail) {
                 errorMessage = errors.detail;
             } else {
                 // Handle non-field errors or other formats if needed
                 const errorMessages = Object.keys(errors).map(key => `${key}: ${errors[key]}`);
                 if(errorMessages.length > 0) errorMessage = errorMessages.join('\n');
             }
        } else if(error.message) {
            errorMessage = error.message;
        }
        Alert.alert('Error', errorMessage);
        console.error('Password Reset Error:', error.response || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.subtitle}>
        Enter your registered email to receive a password reset link.
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Updated Button */}
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleReset}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Reset Link</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles updated slightly
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
    flexDirection: 'row', // For indicator alignment
    justifyContent: 'center', // For indicator alignment
    alignItems: 'center', // For indicator alignment
    minHeight: 50, // Ensure height for indicator
  },
  buttonDisabled: {
    backgroundColor: '#a0c3e2', // Lighter color when disabled
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  link: {
    color: '#1976d2',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});