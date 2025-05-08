import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ScreenHeader = ({ title, navigation, showBackButton = true }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10, paddingBottom: 10 }]}>
      {showBackButton && (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#1e293b" />
        </TouchableOpacity>
      )}
      <View style={styles.titleWrapper}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {/* Placeholder for potential right-side actions if ever needed */}
      {showBackButton && <View style={styles.placeholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distributes space
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc', // Light background, or choose another
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // Subtle border
  },
  backButton: {
    padding: 8, // Make it easier to tap
    marginRight: 12, // Space between button and title
  },
  titleWrapper: {
    flex: 1, // Allows title to take available space and be centered
    alignItems: 'center', // Center title horizontally
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b', // Darker text
    textAlign: 'center',
  },
  placeholder: { // Ensures title is centered even with a back button
    width: 40, // Approx width of the back button + margin
  }
});

export default ScreenHeader;