import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/apiClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUserData = await AsyncStorage.getItem('userData');

        if (storedToken && storedUserData) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserData));
          console.log('Auth data loaded from storage.');
        }
      } catch (e) {
        console.error('Failed to load auth data from storage', e);
      } finally {
        setLoading(false);
      }
    };
    loadAuthData();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login/', { username, password });
      const { token: receivedToken, user: userData } = response.data;

      await AsyncStorage.setItem('authToken', receivedToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setToken(receivedToken);
      setUser(userData);
      console.log('Login successful, token and user data stored.');
    } catch (error) {
      console.error('Login failed:', error.response ? error.response.data : error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    // registrationData should be an object like:
    // { username, password, confirm_password, email, full_name }
    setLoading(true);
    try {
      // Make sure password and confirm_password match before sending
      if (registrationData.password !== registrationData.confirm_password) {
        throw new Error("Passwords do not match");
      }

      const response = await apiClient.post('/auth/register/', registrationData);
      const { token: receivedToken, user: userData } = response.data;

      // Automatically log in the user after successful registration
      await AsyncStorage.setItem('authToken', receivedToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setToken(receivedToken);
      setUser(userData);
      console.log('Registration successful, user logged in.');

    } catch (error) {
      console.error('Registration failed:', error.response ? error.response.data : error.message);
      throw error; // Rethrow to be caught in the component
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post('/auth/logout/');
      console.log('Backend logout successful.');
    } catch (error) {
      console.error('Logout failed:', error.response ? error.response.data : error.message);
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);