import React, { useState, useEffect, useRef, useContext } 
from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { AuthContext } from '../../navigation/AuthProvider';
import logo from '../../assets/logo.png';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [fullName, setFullName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false); 

  const { register, loading: authLoading } = useContext(AuthContext);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!username || !fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    const registrationData = {
      username: username, 
      full_name: fullName,
      email: email,
      password: password,
      confirm_password: confirmPassword,
    };

    setIsSubmitting(true);
    try {
      await register(registrationData);
    } catch (error) {
        let errorMessage = 'Registration failed. Please try again.';
        if (error.response?.data) {
            const errors = error.response.data;
            const errorMessages = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`);
            if (errorMessages.length > 0) {
                errorMessage = errorMessages.join('\n');
            } else if (errors.detail) {
                 errorMessage = errors.detail;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }
        Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.innerContainer}>
        <Animated.Image
            source={logo}
            style={[
            styles.logo,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            },
            ]}
        />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        {/* Input fields */}
        <TextInput
            placeholder="Username"
            placeholderTextColor="#999"
            style={styles.input}
            onChangeText={setUsername}
            value={username}
        />
        <TextInput
            placeholder="Full Name"
            placeholderTextColor="#999"
            style={styles.input}
            onChangeText={setFullName}
            value={fullName}
        />
        <TextInput
            placeholder="Email Address"
            placeholderTextColor="#999"
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
        />
        <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            onChangeText={setPassword}
            value={password}
        />
        <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            onChangeText={setConfirmPassword}
            value={confirmPassword}
        />

        <TouchableOpacity
            style={[styles.button, (isSubmitting || authLoading) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting || authLoading}
        >
            {isSubmitting || authLoading ? (
            <ActivityIndicator size="small" color="#fff" />
            ) : (
            <Text style={styles.buttonText}>Register</Text>
            )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
        </View>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1, 
    justifyContent: 'center',
  },
  innerContainer: { 
    padding: 24,
    backgroundColor: '#f5f7fa',
  },
  logo: {
    width: 100, 
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 15, 
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10, 
    marginBottom: 14, 
    fontSize: 15, 
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10, 
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#a0c3e2',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25, 
  },
  loginText: {
    color: '#555',
    fontSize: 15,
  },
  loginLink: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 15,
  },
});