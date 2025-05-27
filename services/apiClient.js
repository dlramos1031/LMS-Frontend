import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_PORT = 8000;

const PRODUCTION_URL = 'https://dlramos1031.pythonanywhere.com/';
const EXPO_GO_URL = 'http://10.0.2.2:8000/';
const DEV_URL = 'http://192.168.137.1:8000/';


const getBaseUrl = () => {
  // Check if running in Expo Go or a development build with a debugger connection
  const isStandalone = Constants.executionEnvironment === 'standalone';
  const isBare = Constants.executionEnvironment === 'bare';
  console.log(Constants.executionEnvironment);
  return EXPO_GO_URL;
};

const baseURL = getBaseUrl();
console.log(`[apiClient] API Base URL: ${baseURL}`);

const apiClient = axios.create({
  baseURL: baseURL,
  timeout: 10000,
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