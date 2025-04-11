// frontend/navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import YourBooksScreen from '../screens/YourBooksScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 5,
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          elevation: 10,
        },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Home':
              return <Ionicons name="home-outline" size={size} color={color} />;
            case 'Your Books':
              return <Feather name="book" size={size} color={color} />;
            case 'Notifications':
              return <Ionicons name="notifications-outline" size={size} color={color} />;
            case 'Profile':
              return <MaterialIcons name="person-outline" size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Your Books" component={YourBooksScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
