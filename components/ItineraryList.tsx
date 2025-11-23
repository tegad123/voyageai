import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, FlatList, LayoutAnimation, TouchableOpacity, Linking } from 'react-native';
import { DailyPlan } from '../context/ItineraryContext';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { log } from '../utils/log';
import { useRouter } from 'expo-router';
import { buildPlacePhotoUrl } from '../utils/image';
import axios from '../api/axios';
import Colors from '../constants/Colors';

// Icon map by suggestion type
const iconForType = (type?: string) => {
  const t = String(type || '').toUpperCase();
  const color = Colors.light.tint;
  switch (t) {
    case 'HOTEL':
      return <FontAwesome name="hotel" size={16} color={color} style={{ marginRight: 8 }} />;
    case 'RESTAURANT':
      return <Ionicons name="restaurant" size={16} color={color} style={{ marginRight: 8 }} />;
    case 'ACTIVITY':
      return <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color={color} style={{ marginRight: 8 }} />;
    case 'TRANSPORT':
    case 'FLIGHT':
      return <Ionicons name="airplane" size={16} color={color} style={{ marginRight: 8 }} />;
    default:
      return <Ionicons name="pricetag-outline" size={16} color={color} style={{ marginRight: 8 }} />;
  }
};

interface Props {
  plans: DailyPlan[];
  hideDayHeaders?: boolean;
}

function CardImageLoader({ item }: { item: any }) {
  const PLACEHOLDER = 'https://placehold.co/600x300/333333/9c9c9c?text=Loading…';

  const initialUri =
    item.imageUrl ||
    item.thumbUrl ||
    buildPlacePhotoUrl(item.photoReference, 800) ||
    PLACEHOLDER;
  const [uri, setUri] = useState<string>(initialUri);

  useEffect(() => {
    // Attempt to fetch a thumbnail if none is present
    if (!item.thumbUrl && !item.photoReference && !item.imageUrl) {
      (async () => {
        try {
          if (!item.title) return;
          const cleanQ = item.title
            .replace(/^(Check\-in at|Check\-out from|Visit|Explore|Dinner at|Lunch at|Breakfast at|Shopping in|Relax at|Depart from|Arrive in)\s+/i, '')
            .trim();

          const city = item.destinationCity || item.city || '';
          const country = item.destinationCountry || item.country || '';
          const countryCode = (item.country_code || item.countryCode || '').toString().toLowerCase();

          const parts = [cleanQ];
          if (city) parts.push(city);
          if (country && !parts.includes(country)) parts.push(country);
          const finalQuery = parts.filter(Boolean).join(', ');

          const params: Record<string, string> = { query: finalQuery };
          if (countryCode.length === 2) {
            params.country = countryCode;
          }

          const res = await axios.get('/places', { params });

          const nextUri = res.data?.photoUrl || res.data?.thumbUrl;
          if (nextUri) {
            setUri(nextUri);

            // Mutate item so downstream components get the enriched assets
            item.imageUrl = res.data?.photoUrl || item.imageUrl;
            item.thumbUrl = res.data?.thumbUrl || res.data?.photoUrl || item.thumbUrl;
            item.photoReference = res.data?.photoReference || item.photoReference;
          }

          if (res.data?.bookingUrl) {
            item.bookingUrl = res.data.bookingUrl;
          }
          
          // Save reviews and rating from Google Places
          if (res.data?.reviews && Array.isArray(res.data.reviews)) {
            item.reviews = res.data.reviews;
            console.log(`[CARD] Saved ${res.data.reviews.length} reviews for "${item.title}"`);
          }
          if (typeof res.data?.rating === 'number') {
            item.rating = res.data.rating;
          }
          
          if (typeof res.data?.lat === 'number' && typeof res.data?.lng === 'number') {
            (item as any).lat = res.data.lat;
            (item as any).lng = res.data.lng;
          }
        } catch (err: any) {
          console.warn('[CARD] place fetch failed', err?.message);
        }
      })();
    }
  }, [item]);

  log('[CARD] using image', item.title, uri);

  return (
    <Image
      source={{ uri }}
      style={styles.cardHeaderImage}
      resizeMode="cover"
      onLoadEnd={() => LayoutAnimation.easeInEaseOut()}
    />
  );
}

const ItineraryList: React.FC<Props> = ({ plans, hideDayHeaders }) => {
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const router = useRouter();
  console.log('[ItineraryList] Received plans:', JSON.stringify(plans, null, 2));

  if (plans.length === 0) {
    return <Text style={{ color: '#999', textAlign: 'center' }}>No itinerary yet</Text>;
  }

  log('[LIST] rendering', plans.length, 'days');

  return (
    <View>
      {plans.map(day => {
        const expanded = expandedDays[day.day] ?? true;
        // Hotel-first ordering: stable partition
        const hotels = day.items.filter(it => String(it.type).toUpperCase() === 'HOTEL');
        const others = day.items.filter(it => String(it.type).toUpperCase() !== 'HOTEL');
        const orderedItems = [...hotels, ...others];
        return (
          <View key={day.day}>
            {!hideDayHeaders && (
              <Pressable
                style={styles.dayHeader}
                onPress={() => setExpandedDays(prev => ({ ...prev, [day.day]: !expanded }))}
              >
                <FontAwesome
                  name={expanded ? 'chevron-down' : 'chevron-right'}
                  size={12}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.dayHeaderText}>Day {day.day}</Text>
                <Text style={styles.dayHeaderDate}>{day.date}</Text>
              </Pressable>
            )}

            {expanded && (
              <View style={{ marginTop: hideDayHeaders ? 0 : 8 }}>
                {orderedItems.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.cardContainer}
                    activeOpacity={0.8}
                  onPress={() => {
                      router.push({ pathname: '/detail', params: { data: JSON.stringify(item), fromModal: 'true', returnTo: '/itinerary' } });
                    }}
                  >
                    <CardImageLoader item={item} />
                    <View style={styles.cardBody}>
                      <View style={styles.titleRow}>
                        <View style={{ flexDirection:'row', alignItems:'center' }}>
                          {iconForType(item.type)}
                          <Text style={styles.cardTitle}>{item.title}</Text>
                        </View>
                      </View>
                      {['HOTEL','RESTAURANT'].includes(item.type) && item.rating && (
                        <View style={{ flexDirection:'row', alignItems:'center' }}>
                          <FontAwesome name="star" size={14} color="#f1c40f" style={{ marginRight: 4 }} />
                          <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
                        </View>
                      )}

                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dayHeaderDate: {
    marginLeft: 8,
    color: '#999',
    fontSize: 14,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 1,
  },
  cardHeaderImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardBody: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  bookBtn: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addBtnText: {
    color: '#6B5B95',
    marginLeft: 4,
  },
});

export default ItineraryList; 