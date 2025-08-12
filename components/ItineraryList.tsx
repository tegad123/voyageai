import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Pressable, FlatList, LayoutAnimation, TouchableOpacity, Linking } from 'react-native';
import { DailyPlan } from '../context/ItineraryContext';
import { FontAwesome } from '@expo/vector-icons';
import { log } from '../utils/log';
import { useRouter } from 'expo-router';
import { buildPlacePhotoUrl } from '../utils/image';
import axios from '../api/axios';

interface Props {
  plans: DailyPlan[];
  hideDayHeaders?: boolean;
}

function CardImageLoader({ item }: { item: any }) {
  const PLACEHOLDER = 'https://placehold.co/600x300/333333/9c9c9c?text=Loading…';

  const initialUri = item.thumbUrl || buildPlacePhotoUrl(item.photoReference, 800) || item.imageUrl || PLACEHOLDER;
  const [uri, setUri] = useState<string>(initialUri);

  useEffect(() => {
    // Attempt to fetch a thumbnail if none is present
    if (!item.thumbUrl && !item.photoReference) {
      (async () => {
        try {
          if (!item.title) return;
          const cleanQ = item.title
            .replace(/^(Check\-in at|Check\-out from|Visit|Explore|Dinner at|Lunch at|Breakfast at|Shopping in|Relax at|Depart from|Arrive in)\s+/i, '')
            .trim();

          const res = await axios.get('/places', { params: { query: `${cleanQ} in ${item.destinationCity || ''}` } });

          if (res.data?.thumbUrl) {
            // Update local image URI first for immediate UI refresh
            setUri(res.data.thumbUrl);

            // Mutate the item so future renders have the image cached
            item.thumbUrl = res.data.thumbUrl;
            item.photoReference = res.data.photoReference;
          }

          if (res.data?.bookingUrl) {
            item.bookingUrl = res.data.bookingUrl;
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
                      router.push({ pathname: '/detail', params: { data: JSON.stringify(item) } });
                    }}
                  >
                    <CardImageLoader item={item} />
                    <View style={styles.cardBody}>
                      <View style={styles.titleRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
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