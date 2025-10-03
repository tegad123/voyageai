import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  itineraryData: {
    title: string;
    days: any[];
  } | null;
}

export default function MapPanel({ visible, onClose, itineraryData }: Props) {
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loaded');
  
  // Debug: lifecycle + props
  console.log('[MAP_PANEL] render', {
    visible,
    hasData: !!itineraryData,
    title: itineraryData?.title,
    days: itineraryData?.days?.length ?? 0,
    loadingState,
  });

  useEffect(() => {
    console.log('[MAP_PANEL] visibility changed:', visible);
    // Skip loading state - show content immediately
    setLoadingState('loaded');
  }, [visible]);

  if (!visible) {
    console.log('[MAP_PANEL] not visible → returning null');
    return null;
  }
  if (!itineraryData) {
    console.log('[MAP_PANEL] missing itineraryData → returning null');
    return null;
  }

  // Generate map HTML with color-coded pins for each day
  const generateMapHTML = () => {
    const colors = ['red', 'blue', 'green', 'orange', 'purple', 'yellow', 'cyan'];
    let markersJS = '';
    let bounds = '';
    
    itineraryData.days.forEach((day, dayIndex) => {
      const color = colors[dayIndex % colors.length];
      day.items.forEach((item: any, itemIndex: number) => {
        if (item.title) {
          const markerTitle = `Day ${dayIndex + 1}: ${item.title}`;
          const encodedTitle = encodeURIComponent(item.title);
          
          markersJS += `
            // Add marker for ${item.title}
            fetch('https://maps.googleapis.com/maps/api/geocode/json?address=${encodedTitle}&key=YOUR_API_KEY')
              .then(response => response.json())
              .then(data => {
                if (data.results && data.results[0]) {
                  const location = data.results[0].geometry.location;
                  const marker = new google.maps.Marker({
                    position: location,
                    map: map,
                    title: '${markerTitle}',
                    icon: {
                      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
                          <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${dayIndex + 1}</text>
                        </svg>
                      \`),
                      scaledSize: new google.maps.Size(24, 24),
                    }
                  });
                  bounds.extend(location);
                  map.fitBounds(bounds);
                }
              })
              .catch(err => console.log('Geocoding failed for ${item.title}'));
          `;
        }
      });
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { height: 100%; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    
    <script>
        function initMap() {
            const map = new google.maps.Map(document.getElementById('map'), {
                zoom: 13,
                center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC, will be adjusted by bounds
                mapTypeId: 'roadmap'
            });
            
            const bounds = new google.maps.LatLngBounds();
            
            ${markersJS}
        }
        
        window.onload = initMap;
    </script>
    <script async defer 
        src="https://maps.googleapis.com/maps/api/js?key=${Constants.expoConfig?.extra?.googlePlacesKey || 'YOUR_API_KEY'}&callback=initMap">
    </script>
</body>
</html>
    `;
  };

  // For now, create a simplified version without Google Maps API
  const generateSimpleMapHTML = () => {
    const locations = itineraryData.days
      .flatMap((day, dayIndex) => 
        day.items.map((item: any) => ({
          title: item.title,
          day: dayIndex + 1,
          color: ['red', 'blue', 'green', 'orange', 'purple', 'yellow', 'cyan'][dayIndex % 7]
        }))
      )
      .filter(loc => loc.title);

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { 
            margin: 0; 
            padding: 10px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
        }
        .map-container {
            background: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .map-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
        }
        .location-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .location-item:last-child {
            border-bottom: none;
        }
        .day-marker {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-right: 10px;
            flex-shrink: 0;
        }
        .location-name {
            font-size: 14px;
            color: #333;
        }
        .day-label {
            font-size: 12px;
            color: #666;
            margin-left: auto;
            padding-left: 10px;
        }
    </style>
</head>
<body>
    <div class="map-container">
        <div class="map-title">📍 ${itineraryData.title} Locations</div>
        ${locations.map(loc => `
            <div class="location-item">
                <div class="day-marker" style="background-color: ${loc.color}">
                    ${loc.day}
                </div>
                <div class="location-name">${loc.title}</div>
                <div class="day-label">Day ${loc.day}</div>
            </div>
        `).join('')}
    </div>
    <script>
        // Signal that the page has loaded
        window.addEventListener('load', function() {
            console.log('[MAP_HTML] Page loaded');
        });
    </script>
</body>
</html>`;
  };

  const locationsSummary = useMemo(() => {
    try {
      const locs = itineraryData.days
        .flatMap((day, dayIndex) => day.items.map((item: any) => ({
          title: item?.title,
          day: dayIndex + 1,
        })))
        .filter(l => !!l.title);
      const sample = locs.slice(0, 5).map(l => `${l.day}:${l.title}`);
      return { count: locs.length, sample };
    } catch (e) {
      return { count: 0, sample: [] as string[] };
    }
  }, [itineraryData]);

  console.log('[MAP_PANEL] locations', locationsSummary);

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
        
        {/* Loading Banner */}
        {loadingState !== 'loaded' && (
          <View style={styles.loadingBanner}>
            <Text style={styles.loadingText}>
              {loadingState === 'loading' ? 'Loading map...' : 'Error loading map'}
            </Text>
          </View>
        )}

        {/* Map Content */}
        <View style={styles.mapContent}>
          <WebView
            source={{ html: generateSimpleMapHTML() }}
            style={styles.webview}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            originWhitelist={["*"]}
            baseUrl=""
            onLoadStart={() => {
              console.log('[MAP_PANEL] WebView load start');
              setLoadingState('loading');
            }}
            onLoadEnd={() => {
              console.log('[MAP_PANEL] WebView load end');
              // Force loading state to complete after a short delay
              setTimeout(() => {
                console.log('[MAP_PANEL] Setting loaded state');
                setLoadingState('loaded');
              }, 500);
            }}
            onError={(e) => {
              console.log('[MAP_PANEL] WebView error', e.nativeEvent);
              setLoadingState('error');
            }}
            onMessage={(event) => {
              console.log('[MAP_PANEL] WebView message:', event.nativeEvent.data);
            }}
          />
        </View>
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
  },
  webview: {
    flex: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  loadingBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    zIndex: 10,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
