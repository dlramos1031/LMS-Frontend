import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import BookDetailsScreen from '../screens/BookDetailsScreen';
import BorrowScreen from '../screens/BorrowScreen';
import BorrowDetailScreen from '../screens/BorrowDetailScreen';
import YourBooksScreen from '../screens/YourBooksScreen';
import AboutScreen from '../screens/AboutScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ScreenHeader from '../components/ScreenHeader';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="BookDetailsScreen"
        component={BookDetailsScreen}
        options={({ navigation, route }) => ({
          headerShown: true, // Show the header
          header: () => (
            <ScreenHeader
              title={route.params?.book?.title || 'Book Details'}
              navigation={navigation}
            />
          ),
        })}
      />
      <Stack.Screen
        name="BorrowScreen"
        component={BorrowScreen}
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => (
            <ScreenHeader
              title="Borrow Book" // Or get title from route.params?.book?.title
              navigation={navigation}
            />
          ),
        })}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => <ScreenHeader title="About" navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => <ScreenHeader title="Settings" navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="BorrowDetail"
        component={BorrowDetailScreen}
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => <ScreenHeader title="Borrow Details" navigation={navigation} route={route} />, 
        })}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <ScreenHeader 
              title="Edit Profile" 
              navigation={navigation} 
              canGoBack={navigation.canGoBack()}
            />
          ),
        })}
      />
      <Stack.Screen name="YourBooksScreen" component={YourBooksScreen} />
    </Stack.Navigator>
  );
}
