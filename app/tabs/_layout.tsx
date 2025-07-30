import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Index from './index';
import Trips from './trips';
import Profile from './profile';
import { useLanguage } from '../../context/LanguageContext';

console.log('=== [app/tabs/_layout.tsx] File top-level loaded ===');

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState('index');
  const { t } = useLanguage();

  const renderContent = () => {
    switch (activeTab) {
      case 'index':
        return <Index />;
      case 'trips':
        return <Trips />;
      case 'profile':
        return <Profile />;
      default:
        return <Index />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'index' && styles.activeTab]}
          onPress={() => setActiveTab('index')}
        >
          <Ionicons
            name="home"
            size={24}
            color={activeTab === 'index' ? '#6B5B95' : '#999999'}
          />
          <Text style={[styles.tabText, activeTab === 'index' && styles.activeTabText]}>
            {t('Home')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
          onPress={() => setActiveTab('trips')}
        >
          <Ionicons
            name="map"
            size={24}
            color={activeTab === 'trips' ? '#6B5B95' : '#999999'}
          />
          <Text style={[styles.tabText, activeTab === 'trips' && styles.activeTabText]}>
            {t('Trips')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person"
            size={24}
            color={activeTab === 'profile' ? '#6B5B95' : '#999999'}
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            {t('Profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: '#6B5B95',
  },
  tabText: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    marginTop: 4,
  },
  activeTabText: {
    color: '#6B5B95',
    fontWeight: '600',
  },
}); 