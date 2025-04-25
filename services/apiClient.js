import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your Django backend's local IP address
const API_BASE_URL = 'http://192.168.56.1:8000/api/';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Adds the auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Optional): Handle common responses/errors
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  async (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      if (error.response.status === 401) {
        // Handle unauthorized access, e.g., token expired or invalid
        // Optionally clear token and navigate to login
        console.log('Unauthorized access detected, logging out.');
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        // Add navigation logic here if needed, or handle in AuthProvider
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;