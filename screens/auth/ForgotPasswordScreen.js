import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleReset = async () => {
    try {
      if (!email) {
        Alert.alert('Error', 'Please enter your email.');
        return;
      }

      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Check your email for a reset link.');

      // Safe navigation (only go back if possible)
      if (navigation.canGoBack()) {
        navigation.goBack(); // Goes back to login if from AuthStack
      }

    } catch (error) {
      Alert.alert('Error', error.message);
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

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

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
