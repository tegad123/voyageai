import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useItinerary } from '../context/ItineraryContext';
import { useChatSessions } from '../context/ChatSessionContext';
import EditItineraryModal from '../components/EditItineraryModal';
import ItineraryTabs from '../components/ItineraryTabs';
import { v4 as uuid } from 'uuid';
import { format, parseISO } from 'date-fns';
import { useLanguage } from '../context/LanguageContext';

export default function ItineraryScreen() {
  const router = useRouter();
  const { plans, tripTitle } = useItinerary();
  const { currentSession, attachItinerary } = useChatSessions();
  const [showEdit, setShowEdit] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { t } = useLanguage();

  const handleSaveTrip = () => {
    if (!plans || plans.length === 0) {
      Alert.alert('Error', 'No itinerary to save');
      return;
    }

    if (isSaved) {
      Alert.alert('Already Saved', 'This itinerary is already saved to your drafts');
      return;
    }

    // --- Determine location ---
    let location: string | null = tripTitle ?? null;

    const firstItem = plans?.[0]?.items?.[0];

    if (!location && firstItem) {
      // Prefer explicit destinationCity field if present
      if ((firstItem as any).destinationCity) {
        location = (firstItem as any).destinationCity;
      }
    }

    if (!location && firstItem?.title) {
      const t = firstItem.title;
      // Examples: "Arrival in Tokyo", "Flight to Paris", "Day trip to Akihabara for ..."
      const inMatch = t.match(/\bin\s+([A-Za-z\s]+)/i);
      const toMatch = t.match(/\bto\s+([A-Za-z\s]+)/i);
      if (inMatch) location = inMatch[1].trim();
      else if (toMatch) location = toMatch[1].trim();
      else {
        // fallback: last word token (capitalised)
        const words = t.split(/\s+/);
        location = words[words.length - 1];
      }
    }

    location = (location || 'Trip').replace(/^[\s,]+|[\s,]+$/g, '');

    const startISO = plans[0].date;
    const endISO = plans[plans.length - 1].date;
    const startStr = format(parseISO(startISO), 'MMM d');
    const endStr = format(parseISO(endISO), 'MMM d');
    const title = `${location} • ${startStr} – ${endStr}`;

    // ------ Pick landmark thumbnail ------
    let thumb: string | undefined;
    outer: for (const day of plans) {
      for (const item of day.items) {
        if (item.thumbUrl || item.imageUrl) {
          thumb = item.thumbUrl || item.imageUrl;
          break outer;
        }
      }
    }

    // Create a new itinerary record
    const itineraryId = uuid();
    const itineraryRecord = {
      id: itineraryId,
      title,
      days: plans,
      createdAt: Date.now(),
      chatMessageId: currentSession.messages[currentSession.messages.length - 1]?.id || '',
      saved: true,
      chatSessionId: currentSession.id,
      status: 'draft' as const,
      image: thumb,
    } as const;

    // Attach to the last message or create a new one
    const lastMessageId = currentSession.messages[currentSession.messages.length - 1]?.id;
    if (lastMessageId) {
      attachItinerary(lastMessageId, itineraryRecord);
    }

    setIsSaved(true);
    Alert.alert('Success', 'Trip saved to your drafts!');
  };

  if (!plans || plans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No itinerary available</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color="#6B5B95" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tripTitle || t('Your Trip')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSaveTrip} style={styles.navBtn}>
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isSaved ? "#6B5B95" : "#6B5B95"} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowEdit(true)} style={styles.navBtn}>
            <Ionicons name="create-outline" size={20} color="#6B5B95" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Itinerary tabs */}
      <ItineraryTabs plans={plans} />

      {/* Edit modal */}
      <EditItineraryModal
        visible={showEdit}
        plans={plans}
        tripTitle={tripTitle}
        messages={currentSession.messages}
        onSave={() => {}}
        onClose={() => setShowEdit(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#6B5B95',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999' },
}); 