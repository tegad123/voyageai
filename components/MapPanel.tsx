import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  itineraryData: {
    title: string;
    days: any[];
  } | null;
}

export default function MapPanel({ visible, onClose, itineraryData }: Props) {
  if (!visible) {
    console.log('[MAP_PANEL] not visible → returning null');
    return null;
  }
  if (!itineraryData) {
    console.log('[MAP_PANEL] missing itineraryData → returning null');
    return null;
  }

  const locationsSummary = useMemo(() => {
    const colors = ['#ff6b6b', '#4dabf7', '#51cf66', '#ff922b', '#845ef7', '#fcc419', '#63e6be'];
    try {
      const locs = itineraryData.days?.flatMap((day, dayIndex) =>
        (day.items || []).map((item: any) => ({
          title: item?.title || 'Unnamed stop',
          day: dayIndex + 1,
          color: colors[dayIndex % colors.length],
        })),
      ) || [];
      return locs;
    } catch (error) {
      console.warn('[MAP_PANEL] Failed to build locations list', error);
      return [];
    }
  }, [itineraryData]);

  return (
    <View style={styles.overlay}>
      <View style={styles.mapContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Map View</Text>
          <TouchableOpacity onPress={() => { console.log('[MAP_PANEL] close pressed'); onClose(); }} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        {/* Location summary */}
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryText}>
            {locationsSummary.length
              ? `Showing ${locationsSummary.length} stops from ${itineraryData.title}`
              : 'No locations available for this itinerary yet.'}
          </Text>
        </View>

        <ScrollView
          style={styles.mapContent}
          contentContainerStyle={styles.locationList}
          showsVerticalScrollIndicator={false}
        >
          {locationsSummary.map((loc, index) => (
            <View key={`${loc.title}-${index}`} style={styles.locationItem}>
              <View style={[styles.dayMarker, { backgroundColor: loc.color }]}>
                <Text style={styles.dayMarkerText}>{loc.day}</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>{loc.title}</Text>
                <Text style={styles.locationMeta}>Day {loc.day}</Text>
              </View>
            </View>
          ))}
          {!locationsSummary.length && (
            <Text style={styles.emptyText}>
              Add activities to your itinerary to see them summarized here.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 16,
    paddingBottom: 100,
    zIndex: 1000,
  },
  mapContainer: {
    width: Math.min(320, width * 0.8),
    height: Math.min(400, height * 0.5),
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  mapContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f4f4f4',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5e5',
  },
  summaryText: {
    fontSize: 13,
    color: '#555',
  },
  locationList: {
    paddingVertical: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececec',
  },
  dayMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dayMarkerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  locationMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
