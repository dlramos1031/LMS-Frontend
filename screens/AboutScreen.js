import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>LibraryMate</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.description}>
          LibraryMate is a modern library management system that helps students and institutions
          easily browse, borrow, and return books with powerful tracking features.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Developed By</Text>
        <Text style={styles.detail}>Neo Group</Text>
        <Text style={styles.detail}>Email: michaelgeneralao03@gmail.com</Text>
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
  card: {
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#0f172a',
  },
  detail: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 4,
  },
});
