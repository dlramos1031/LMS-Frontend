import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native'; 
import { AuthContext } from './AuthProvider'; 
import AuthStack from './AuthStack';
import MainStack from './MainStack';

export default function RootNavigator() {
  const { token, loading } = useContext(AuthContext); 

  if (loading) {
    // Show a loading spinner while checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render MainStack if token exists, otherwise AuthStack
  return token ? <MainStack /> : <AuthStack />;
}