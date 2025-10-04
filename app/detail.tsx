import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import axios from '../api/axios';
import { Review } from '../context/ItineraryContext';
import { log, warn } from '../utils/log';
import { cacheImage, getCachedImage } from '../utils/imageCache';
import { buildPlacePhotoUrl } from '../utils/image';
import { fetchPlaceData, fetchPlaceById } from '../utils/places';

export default function DetailScreen() {
  const router = useRouter();
  const { data, fromModal, returnTo } = useLocalSearchParams();
  const parsedItem = React.useMemo(() => {
    try {
      return data ? JSON.parse(Array.isArray(data) ? data[0] : data) : null;
    } catch {
      return null;
    }
  }, [data]);

  const [item, setItem] = useState<any>(() => {
    const obj = parsedItem;
    if (obj?.title && obj.imageUrl === undefined) {
      const cached = getCachedImage(obj.title);
      if (cached) obj.imageUrl = cached;
    }
    console.log('[DETAIL] initial item', {
      title: obj?.title,
      imageUrl: obj?.imageUrl,
      thumbUrl: obj?.thumbUrl,
      photoReference: obj?.photoReference,
    });
    return obj;
  });

  const [detailsFetched, setDetailsFetched] = useState(false);

  useEffect(() => {
    if (!item) return;
    if (detailsFetched) return; // avoid duplicate fetches

    if (item.description && item.reviews) {
      setDetailsFetched(true);
      return; // no need to fetch
    }

    (async () => {
      try {
        if (item.place_id) {
          const res = await fetchPlaceById(item.place_id);
          log('[DETAIL] fetched place details by id', res);
          setItem((prev:any) => {
            const img = prev.imageUrl || res.photoUrl || buildPlacePhotoUrl(res.photoReference, 800);
            console.log('[DETAIL] after enrichment', prev.title, 'imageUrl=', img);
            if(prev.title && img) cacheImage(prev.title,img);
            return { ...prev, description: res.description, reviews: res.reviews, bookingUrl: res.bookingUrl || prev.bookingUrl, place_id: res.place_id ?? prev.place_id, imageUrl: img };
          });
          setDetailsFetched(true);
          return;
        }

        // Fallback – search by query/title
        const cleanQuery = item.title.replace(/^(Check\-in at|Visit|Dinner at|Lunch at|Breakfast at)\s+/i,'').trim();
        const res = await fetchPlaceData(cleanQuery);
        log('[DETAIL] fetched place details by query', res);
        setItem((prev:any) => {
          const img = prev.imageUrl || res.photoUrl || buildPlacePhotoUrl(res.photoReference, 800);
          console.log('[DETAIL] after enrichment', prev.title, 'imageUrl=', img);
          if(prev.title && img) cacheImage(prev.title,img);
          return { ...prev, description: res.description, reviews: res.reviews, bookingUrl: res.bookingUrl || prev.bookingUrl, place_id: res.place_id ?? prev.place_id, imageUrl: img };
        });
        setDetailsFetched(true);
      } catch (e: any) {
        warn('[DETAIL] failed to fetch details', e.message);
        setDetailsFetched(true);
      }
    })();
  }, [item, detailsFetched]);

  if (!item) {
    return (
      <View style={styles.centered}> 
        <Text style={{ color: '#fff' }}>No data</Text>
      </View>
    );
  }

  const isHotelOrRestaurant = ['HOTEL', 'RESTAURANT'].includes(item.type);
  const mapUrl = item.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`;

  const bannerUrl = useMemo(() => {
    if (item.thumbUrl) {
      // attempt to upsize existing thumbUrl from 400→800 if possible
      return item.thumbUrl.replace('maxwidth=400', 'maxwidth=800');
    }
    if (item.photoReference) return buildPlacePhotoUrl(item.photoReference, 1280);
    if (item.imageUrl) return item.imageUrl;
    return buildPlacePhotoUrl(undefined, 800);
  }, [item.photoReference, item.thumbUrl, item.imageUrl]);

  useEffect(() => {
    if (!bannerUrl) return;
    log('[DETAIL] bannerUrl set', bannerUrl);
  }, [bannerUrl]);

  const invalidBooking = !item.bookingUrl || item.bookingUrl.includes('example.com');
  const effectiveBookingUrl = invalidBooking ? undefined : item.bookingUrl;

  return (
    <View style={styles.wrapper}>
      {/* Header image */}
      {(
        <Image
          source={{ uri: bannerUrl }}
          style={styles.headerImage}
          resizeMode="cover"
          onError={(e) => {
            console.warn('[DETAIL] header image onError', e?.nativeEvent?.error, '\nURL:', bannerUrl);
            // Provide deterministic fallback so we can see something instead of blank
            const fallback = buildPlacePhotoUrl(undefined, 800);
            setItem((prev: any) => ({ ...prev, imageUrl: fallback }));
          }}
        />
      )}

      <Pressable style={styles.backBtn} onPress={() => {
        console.log('[DETAIL] Back button pressed, fromModal:', fromModal);
        try {
          // Prefer explicit return route when provided
          if (returnTo) {
            const target = Array.isArray(returnTo) ? returnTo[0] : String(returnTo);
            console.log('[DETAIL] Returning to explicit route:', target);
            router.replace(target);
            return;
          }

          // If opened from a modal flow, let the navigator pop
          if (fromModal === 'true') {
            router.back();
            return;
          }

          // Default: go back if possible, otherwise go to itinerary
          // @ts-ignore expo-router provides back behavior
          if ((router as any).canGoBack?.()) {
            router.back();
          } else {
            router.replace('/itinerary');
          }
        } catch (error) {
          console.error('[DETAIL] Navigation error:', error);
          // Fallback: try to navigate to home
          router.replace('/');
        }
      }}>
        <FontAwesome name="chevron-left" size={20} color="#fff" />
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        {isHotelOrRestaurant && item.rating && (
          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={16} color="#f1c40f" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
        {item.date && <Text style={styles.date}>{item.date}</Text>}
        {item.description && <Text style={styles.description}>{item.description}</Text>}

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.actionBtn, styles.locationBtn]}
            onPress={() => Linking.openURL(mapUrl)}
          >
            <FontAwesome name="map-marker" size={18} color="#fff" />
            <Text style={styles.btnText}>Location</Text>
          </Pressable>

          {effectiveBookingUrl && (
            <Pressable
              style={[styles.actionBtn, styles.bookBtn]}
              onPress={() => Linking.openURL(effectiveBookingUrl)}
            >
              <FontAwesome name="external-link" size={18} color="#fff" />
              <Text style={styles.btnText}>Book</Text>
            </Pressable>
          )}
        </View>

        {/* Reviews */}
        {item.reviews && item.reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionHeader}>Reviews</Text>
            {item.reviews.map((r: Review, idx: number) => (
              <View key={idx} style={styles.reviewCard}>
                <View style={{ flexDirection:'row', alignItems:'center' }}>
                  <FontAwesome name="user" size={14} color="#fff" />
                  <Text style={styles.reviewAuthor}>{r.author_name}</Text>
                  <FontAwesome name="star" size={14} color="#f1c40f" style={{ marginLeft:8 }} />
                  <Text style={styles.reviewRating}>{r.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.reviewText}>{r.text}</Text>
                {r.relative_time_description && (
                  <Text style={styles.reviewTime}>{r.relative_time_description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  headerImage: { width: '100%', height: 260 },
  backBtn: {
    position: 'absolute',
    top: 40,
    left: 16,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  content: { padding: 16 },
  title: { color: '#121212', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  ratingText: { color: '#121212', marginLeft: 4, fontSize: 16 },
  date: { color: '#ccc', marginBottom: 12 },
  description: { color: '#ddd', fontSize: 16, lineHeight: 22, marginBottom: 24 },
  buttonRow: { flexDirection: 'row', justifyContent:'flex-start', alignItems:'center', marginVertical: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 28,
  },
  locationBtn: { backgroundColor: '#6B5B95' },
  bookBtn: { backgroundColor: '#27ae60' },
  btnText: { color: '#FFFFFF', marginLeft: 8, fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  reviewsSection: { marginTop: 24 },
  sectionHeader: { color:'#121212', fontSize:20, fontWeight:'bold', marginBottom:8 },
  reviewCard: { marginBottom:16, backgroundColor:'#F5F5F5', padding:12, borderRadius:12 },
  reviewAuthor: { color:'#121212', marginLeft:4, fontSize:14, fontWeight:'600' },
  reviewRating: { color:'#121212', marginLeft:4, fontSize:14 },
  reviewText: { color:'#333333', marginTop:4, lineHeight:18 },
  reviewTime: { color:'#666', marginTop:4, fontSize:12 },
}); 