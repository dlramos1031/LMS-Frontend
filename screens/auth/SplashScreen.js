// frontend/screens/auth/SplashScreen.js

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Image } from 'react-native';

export default function SplashScreen({ navigation }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      navigation.replace('Login'); // Automatically move to Login after animation
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')} // ✅ Make sure this matches your file location
        style={[
          styles.logo,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
});
