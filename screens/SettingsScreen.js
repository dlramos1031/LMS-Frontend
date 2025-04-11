import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
  const handleOption = (label) => {
    Alert.alert(`${label}`, `This feature is under development.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.option} onPress={() => handleOption('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#334155" />
          <Text style={styles.optionText}>Notification Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => handleOption('Theme')}>
          <Ionicons name="moon-outline" size={22} color="#334155" />
          <Text style={styles.optionText}>Dark Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => handleOption('Security')}>
          <Ionicons name="lock-closed-outline" size={22} color="#334155" />
          <Text style={styles.optionText}>Security</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => handleOption('Feedback')}>
          <Ionicons name="chatbox-ellipses-outline" size={22} color="#334155" />
          <Text style={styles.optionText}>Send Feedback</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#f1f5f9',
    flexGrow: 1,
    
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backBtn: {
    marginRight: 15,
    padding: 6,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  section: {
    marginTop: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    padding: 16,
    marginBottom: 15,
    borderRadius: 12,
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
});
