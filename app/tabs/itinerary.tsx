import React, { useMemo } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useItinerary } from '../../context/ItineraryContext';

interface Activity {
  id: string;
  title: string;
  start: string;
  end: string;
  address?: string;
  category?: string;
  booking?: 'confirmed' | 'pending' | 'needed';
  imageUrl?: string;
}
interface DayBlock {
  date: string;
  items: Activity[];
}

function groupByDay(items: Activity[]): DayBlock[] {
  const map: Record<string, Activity[]> = {};
  items.forEach(it => {
    const dayKey = it.start.slice(0, 10);
    if (!map[dayKey]) map[dayKey] = [];
    map[dayKey].push(it);
  });
  return Object.keys(map)
    .sort()
    .map(date => ({ date, items: map[date].sort((a, b) => a.start.localeCompare(b.start)) }));
}

function formatDayLabel(dateISO: string) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeRange(start: string, end: string) {
  const s = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const e = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${s}–${e}`;
}

export default function ItineraryScreen() {
  const router = useRouter();
  const { plans } = useItinerary();

  const days = useMemo(() => (plans ? groupByDay(plans as any) : []), [plans]);

  if (!plans || plans.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Stack.Screen options={{ presentation: 'modal', title: 'Itinerary' }} />
        <Text style={styles.emptyText}>No itinerary yet. Add a trip to see your schedule.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ presentation: 'modal', title: 'Itinerary' }} />
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {days.map((day, idx) => (
          <View key={day.date} style={styles.dayBlock}>
            <Text style={styles.dayHeader}>{`Day ${idx + 1} • ${formatDayLabel(day.date)}`}</Text>
            {day.items.map(act => (
              <TouchableOpacity
                key={act.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/detail', params: { data: JSON.stringify(act) } })}
              >
                <Image
                  source={{ uri: act.imageUrl || 'https://picsum.photos/seed/' + act.id + '/160/160' }}
                  style={styles.cardImg}
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <View
                      style={[
                        styles.statusDot,
                        act.booking === 'confirmed'
                          ? { backgroundColor: 'green' }
                          : act.booking === 'pending'
                          ? { backgroundColor: 'orange' }
                          : { backgroundColor: '#AAA' },
                      ]}
                    />
                    <Text style={styles.cardTitle}>{act.title}</Text>
                  </View>
                  <Text style={styles.cardTime}>{formatTimeRange(act.start, act.end)}</Text>
                  {act.address && <Text style={styles.cardAddr} numberOfLines={1}>{act.address}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollPad: { paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#FFF' },
  dayBlock: { marginBottom: 32 },
  dayHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 4,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  cardImg: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#eee' },
  cardBody: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111', flexShrink: 1 },
  cardTime: { fontSize: 14, color: '#555' },
  cardAddr: { fontSize: 12, color: '#777', marginTop: 2 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { color: '#555', fontSize: 16, textAlign: 'center' },
}); 