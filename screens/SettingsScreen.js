import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function SettingsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showResetInput, setShowResetInput] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSendFeedback = () => {
    if (feedback.trim() === '') {
      Alert.alert('Feedback is empty', 'Please write something before sending.');
    } else {
      Alert.alert('Thank you!', 'Your feedback has been sent.');
      setFeedback('');
      setShowFeedbackInput(false);
    }
  };

  const handlePasswordReset = () => {
    if (!resetEmail) {
      Alert.alert('Enter Email', 'Please enter your email address.');
      return;
    }

    sendPasswordResetEmail(auth, resetEmail)
      .then(() => {
        Alert.alert('Success', 'Password reset email sent.');
        setResetEmail('');
        setShowResetInput(false);
      })
      .catch((error) => {
        Alert.alert('Error', error.message);
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.option}>
          <Ionicons name="notifications-outline" size={22} color="#334155" />
          <Text style={styles.optionText}>Enable Notifications</Text>
          <Switch
            style={{ marginLeft: 'auto' }}
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        <TouchableOpacity style={styles.option} onPress={() => setShowResetInput(!showResetInput)}>
          <Ionicons name="lock-closed-outline" size={22} color="#334155" />
          <Text style={styles.optionText}>Security</Text>
        </TouchableOpacity>

        {showResetInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
              <Text style={styles.buttonText}>Send Password Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.option} onPress={() => setShowFeedbackInput(!showFeedbackInput)}>
          <Ionicons name="chatbox-ellipses-outline" size={22} color="#334155" />
          <Text style={styles.optionText}>Send Feedback</Text>
        </TouchableOpacity>

        {showFeedbackInput && (
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Write your feedback..."
              placeholderTextColor="#999"
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />
            <TouchableOpacity style={styles.button} onPress={handleSendFeedback}>
              <Text style={styles.buttonText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#f1f5f9',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backBtn: {
    marginRight: 15,
    padding: 6,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    marginTop: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    padding: 16,
    marginBottom: 15,
    borderRadius: 12,
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  inputContainer: {
    backgroundColor: '#e2e8f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
  },
});
