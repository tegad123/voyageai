import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { DailyPlan } from '../context/ItineraryContext';

const dayColors = ['#6B5B95', '#28A745', '#FF8C00', '#E91E63', '#2196F3', '#9C27B0', '#009688'];

export default function MapPanel({ plans, onClose }: { plans: DailyPlan[]; onClose: () => void }) {
  const allCoords = plans.flatMap(d => d.items.map(i => ({ lat: (i as any).lat, lng: (i as any).lng })).filter(p=>p.lat && p.lng));
  const init = allCoords[0] ? { latitude: allCoords[0].lat, longitude: allCoords[0].lng, latitudeDelta: 0.2, longitudeDelta: 0.2 } : { latitude: 0, longitude: 0, latitudeDelta: 60, longitudeDelta: 60 };

  return (
    <View style={styles.wrap}>
      <MapView style={StyleSheet.absoluteFill} provider={PROVIDER_GOOGLE} initialRegion={init}>
        {plans.map((day, idx) => {
          const color = dayColors[idx % dayColors.length];
          const points = day.items
            .map(i => ({ latitude: (i as any).lat, longitude: (i as any).lng }))
            .filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
          return (
            <React.Fragment key={day.day}>
              {points.map((p, i) => (
                <Marker key={`${day.day}-${i}`} coordinate={p} pinColor={color} title={`Day ${day.day}`} />
              ))}
              {points.length >= 2 && (
                <Polyline coordinates={points} strokeColor={color} strokeWidth={4} />
              )}
            </React.Fragment>
          );
        })}
      </MapView>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 260,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6,
  },
  closeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '600' },
}); 