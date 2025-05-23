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
  ActivityIndicator 
} from 'react-native';
import { AuthContext } from '../../navigation/AuthProvider'; 
import logo from '../../assets/logo.png';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); 

  const { login, loading: authLoading } = useContext(AuthContext);

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

  const handleLogin = async () => {
    if (!username || !password) {
        Alert.alert('Error', 'Please enter both username and password.');
        return;
    }

    setIsSubmitting(true); 
    try {
      await login(username, password);
    } catch (error) {
      const errorMessage = error.response?.data?.non_field_errors?.[0] ||
                         error.response?.data?.detail || 
                         'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <View style={styles.container}>
      {/* Animated Logo */}
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

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Log in to your account</Text>

      <TextInput
        placeholder="Username" 
        placeholderTextColor="#999"
        style={styles.input}
        onChangeText={setUsername}
        value={username}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        onChangeText={setPassword}
        value={password}
        autoCapitalize="none"
        secureTextEntry
      />

      {/* Updated Login Button */}
      <TouchableOpacity
        style={[styles.button, (isSubmitting || authLoading) && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isSubmitting || authLoading} 
      >
        {isSubmitting || authLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Register</Text>
        </TouchableOpacity>
      </View>
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
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
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
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 50,
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
  forgot: {
    marginTop: 14,
    textAlign: 'center',
    color: '#1976d2',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerText: {
    color: '#555',
    fontSize: 15,
  },
  registerLink: {
    color: '#1976d2',
    fontWeight: '600',
    fontSize: 15,
  },
});