import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import BorrowScreen from '../screens/BorrowScreen';
import YourBooksScreen from '../screens/YourBooksScreen';
import AboutScreen from '../screens/AboutScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="BookDetailsScreen" component={BookDetailsScreen} />
      <Stack.Screen name="BorrowScreen" component={BorrowScreen} />
      <Stack.Screen name="YourBooksScreen" component={YourBooksScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
