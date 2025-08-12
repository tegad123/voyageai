import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useChatSessions } from '../context/ChatSessionContext';

export default function ItineraryLibrary({ onClose }: { onClose: () => void }) {
  const { sessions } = useChatSessions();

  const pinned = Object.values(sessions)
    .flatMap(s => Object.values(s.itineraries || {}))
    .filter(it => it.saved);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Itinerary Library</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>Close</Text></TouchableOpacity>
      </View>
      {pinned.length === 0 ? (
        <Text style={styles.empty}>No pinned itineraries yet. Pin one from a chat to see it here.</Text>
      ) : (
        <FlatList
          data={pinned.sort((a,b)=>b.createdAt - a.createdAt)}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || 'Untitled Trip'}</Text>
              <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={() => {/* open detail could navigate later */}}>
                  <Text style={styles.btnText}>Open</Text>
                </TouchableOpacity>
                <View style={{ width: 8 }} />
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#eee' }]} onPress={() => {/* unpin in future */}}>
                  <Text style={[styles.btnText, { color: '#111' }]}>Unpin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 320, backgroundColor: 'white', borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: '#ddd', paddingTop: 48, paddingHorizontal: 12 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: 48, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd', paddingHorizontal: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white' },
  title: { fontSize: 16, fontWeight: '700' },
  close: { color: '#6B5B95', fontWeight: '600' },
  empty: { color: '#666', marginTop: 12 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e5e5', borderRadius: 10, padding: 12, marginVertical: 8 },
  cardTitle: { fontWeight: '700', fontSize: 15 },
  cardMeta: { color: '#666', marginTop: 2, marginBottom: 8, fontSize: 12 },
  row: { flexDirection: 'row' },
  btn: { backgroundColor: '#6B5B95', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  btnText: { color: 'white', fontWeight: '600' },
}); 