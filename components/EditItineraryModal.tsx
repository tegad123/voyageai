import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, TextInput, FlatList, Image, ActivityIndicator, LayoutAnimation, TouchableOpacity } from 'react-native';
import { ItineraryItem, DailyPlan } from '../context/ItineraryContext';
import { ChatMessage } from '../context/ChatSessionContext';
// Temporary stub until drag-and-drop is re-enabled without Hermès crash
type RenderItemParams<T> = { item: T; index: number; drag?: () => void; isActive?: boolean };
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from '../api/axios';
import { log, warn } from '../utils/log';
import { getCachedImage, cacheImage } from '../utils/imageCache';
import { buildPlacePhotoUrl } from '../utils/image';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

console.log('=== [components/EditItineraryModal.tsx] File loaded ===');

interface Props {
  visible: boolean;
  plans: DailyPlan[];
  tripTitle: string | null;
  messages: ChatMessage[];
  onSave: (p: DailyPlan[]) => void;
  onClose: () => void;
}

// Moved ThumbLoader outside the main component for performance.
// It's a pure component based on its props, so this prevents it from being
// recreated on every render of EditItineraryModal.
function ThumbLoader({ item }: { item: ItineraryItem }) {
  // Determine initial candidate URL hierarchy
  const PLACEHOLDER = `https://picsum.photos/seed/${encodeURIComponent(item.title)}/100/100?blur=3`;

  const initialUri = (() => {
    if (item.thumbUrl) return item.thumbUrl;
    if (item.photoReference) return buildPlacePhotoUrl(item.photoReference, 100);
    if (item.imageUrl) return item.imageUrl;
    const cached = getCachedImage(item.title);
    if (cached) return cached;
    return PLACEHOLDER;
  })();

  const [uri, setUri] = useState<string>(initialUri);

  useEffect(() => {
    console.log('[THUMB] mount', item.title, 'initial', initialUri.slice(0, 120));
    let active = true;

    async function ensure() {
      // If we already have a non-placeholder URL, try it first
      if (uri && !uri.includes('picsum.photos') && !uri.includes('placeholder')) {
        return;
      }

      // Try /places enrichment
      try {
        const cleanQ = item.title.replace(/^(Check\-in at|Visit|Dinner at|Lunch at|Breakfast at)\s+/i, '').trim();
        const res = await axios.get('/places', { params: { query: cleanQ } });
        const url: string | undefined = res.data.thumbUrl || res.data.photoUrl;
        if (active && url) {
          console.log('[THUMB] fetched', cleanQ, '→', url.slice(0, 120));
          setUri(url);
          cacheImage(item.title, url);
          return;
        }
      } catch (e: any) {
        console.warn('[THUMB] fetch error', e?.message);
      }

      // Final fallback – deterministic picsum image
      const fallback = `https://picsum.photos/seed/${encodeURIComponent(item.title)}/100/100`;
      if (active) {
        console.warn('[THUMB] using fallback', fallback);
        setUri(fallback);
        cacheImage(item.title, fallback);
      }
    }

    ensure();
    return () => {
      active = false;
    };
  }, [item.title]); // Depend on item.title to re-run if item changes

  return (
    <Image
      source={{ uri }}
      style={styles.thumb}
      onError={(e) => {
        console.warn('[THUMB] image onError', item.title, e?.nativeEvent?.error, '\nURL:', uri);
      }}
      onLoadEnd={() => {
        console.log('[THUMB] loaded', item.title);
      }}
    />
  );
}

// Create a memoized row component. This prevents rows from re-rendering
// if their props (item, isActive, etc.) haven't changed, which is a major
// performance boost for lists.
const EventRow = React.memo(
  ({
    item,
    onDelete,
    moveUp,
    moveDown,
    movePrevDay,
    moveNextDay,
    isFirst,
    isLast,
  }: {
    item: ItineraryItem;
    onDelete: (item: ItineraryItem) => void;
    moveUp: () => void;
    moveDown: () => void;
    movePrevDay?: () => void;
    moveNextDay?: () => void;
    isFirst: boolean;
    isLast: boolean;
  }) => {
    return (
      <Pressable
        style={[styles.row, { backgroundColor: '#F5F5F5', borderRadius: 10, marginBottom: 6, marginHorizontal: 4, paddingRight: 12 }]}
      >
        {/* move arrows */}
        <View style={{ width: 48, flexDirection:'row', justifyContent:'space-between' }}>
          {movePrevDay && (
            <TouchableOpacity onPress={movePrevDay} hitSlop={8}>
              <FontAwesome name="arrow-left" size={14} color="#666" />
            </TouchableOpacity>
          )}
          <View style={{ justifyContent:'center', alignItems:'center' }}>
            {!isFirst && (
              <TouchableOpacity onPress={moveUp} hitSlop={8}>
                <FontAwesome name="arrow-up" size={14} color="#666" />
              </TouchableOpacity>
            )}
            {!isLast && (
              <TouchableOpacity onPress={moveDown} hitSlop={8} style={{ marginTop:4 }}>
                <FontAwesome name="arrow-down" size={14} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          {moveNextDay && (
            <TouchableOpacity onPress={moveNextDay} hitSlop={8}>
              <FontAwesome name="arrow-right" size={14} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* thumbnail */}
        <ThumbLoader item={item} />

        {/* Title & subtitle */}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title || 'Untitled Event'}
          </Text>
          {item.type && <Text style={styles.subtitle}>{item.type.charAt(0) + item.type.slice(1).toLowerCase()}</Text>}
        </View>

        {/* delete / more */}
        <Pressable onPress={() => onDelete(item)} hitSlop={12}>
          <FontAwesome name="trash" color="#e74c3c" size={16} />
        </Pressable>
      </Pressable>
    );
  }
);

export default function EditItineraryModal({ visible, plans, tripTitle, messages, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<DailyPlan[]>(plans);
  const [modalDayIdx, setModalDayIdx] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const insets = useSafeAreaInsets();

  // Reset draft when modal opens or source plans change
  useEffect(() => {
    if (visible) {
      setDraft(JSON.parse(JSON.stringify(plans))); // Deep copy to avoid mutation issues

      // Preload thumbnails for items that still lack an image
      (async () => {
        let needsUpdate = false;
        const updatedPlans = [...plans];
        
        for (const day of updatedPlans) {
          for (const item of day.items) {
            if (item.imageUrl) continue;
            try {
              const cleanQ = item.title.replace(/^(Check\-in at|Visit|Dinner at|Lunch at|Breakfast at)\s+/i,'').trim();
              const res = await axios.get('/places', { params: { query: cleanQ } });
              if (res.data.photoUrl) {
                item.imageUrl = res.data.photoUrl;
                needsUpdate = true;
              }
            } catch (e: any) {
              // Use fallback image
              const fallback = `https://picsum.photos/seed/${encodeURIComponent(item.title)}/100/100`;
              item.imageUrl = fallback;
              needsUpdate = true;
            }
          }
        }
        
        if (needsUpdate) {
          setDraft([...updatedPlans]); // Force re-render with new imageUrls
        }
      })();
    }
  }, [visible, plans]);

  // Use useCallback to prevent this function from being recreated on every render,
  // which is essential for memoization to work in child components.
  const handleDelete = useCallback((itemToDelete: ItineraryItem) => {
    setDraft(currentDraft =>
      currentDraft.map(day => ({
        ...day,
        items: day.items.filter(item => item !== itemToDelete),
      }))
    );
  }, []);

  // helper to move item within array
  const moveItem = (arr: ItineraryItem[], from: number, to: number) => {
    const copy = [...arr];
    const [itm] = copy.splice(from,1);
    copy.splice(to,0,itm);
    return copy;
  };

  const handleAddEvents = (dayIdx: number) => {
    setModalDayIdx(dayIdx);
  };

  const confirmAddEvents = async () => {
    if (modalDayIdx === null) return;
    setIsAdding(true);
    try {
      const day = draft[modalDayIdx];
      const prompt = `
        IGNORE PREVIOUS INSTRUCTIONS.
        Your new task is to act as a tool that adds an event to a travel itinerary.
        The user wants to add the following event to Day ${day.day} of their trip to ${tripTitle || 'the destination'}: "${inputText}".

        Your response MUST be ONLY a single JSON object inside a \`\`\`json fence.
        Do not include any other text, conversation, or explanations.

        Example response:
        \`\`\`json
        { "title": "Udon Mugizo", "timeRange": "12:00-13:00", "type": "RESTAURANT" }
        \`\`\`
        Now, generate the JSON for the user's request.`;
      const history = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      const res = await axios.post('/chat', { messages: [...history, { role:'user', content: prompt }], model: 'gpt-4o' });
      const raw = res.data.choices[0].message.content as string;
      const match = raw.match(/[`~]{3}(?:json)?\s*([\s\S]*?)[`~]{3}/i);
      let jsonStr: string | null = match ? match[1] : null;
      if (!jsonStr) {
        const firstBrace = raw.indexOf('{');
        const lastBrace = raw.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) jsonStr = raw.slice(firstBrace, lastBrace +1);
      }
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        console.log('[ADD EVENT] Parsed JSON:', JSON.stringify(parsed, null, 2));
        let candidate:any = parsed.itinerary?.[0]?.items?.[0];
        if(!candidate && Array.isArray(parsed)) candidate = parsed[0];
        if(!candidate && parsed.items) candidate = parsed.items[0];
        if(!candidate && typeof parsed === 'object' && parsed !== null && 'title' in parsed) candidate = parsed;
        console.log('[ADD EVENT] Identified Candidate:', JSON.stringify(candidate, null, 2));
        if (candidate) {
          if(!('type' in candidate) || !candidate.type){ candidate.type='ACTIVITY'; }

          // Try to enrich with Google details (photo, rating, etc.)
          try {
            console.log('[ADD EVENT] Enriching candidate...');
            const cleanQ = candidate.title.replace(/^(Check\-in at|Visit|Dinner at|Lunch at|Breakfast at)\s+/i,'').trim();
            let placeRes = await axios.get('/places',{ params:{ query: cleanQ } });
            // If Google couldn't match the generic title, fall back to the user's raw input + trip location
            if(!placeRes.data.place_id && tripTitle){
              const fallbackQuery = `${inputText} in ${tripTitle}`;
              log('[ADD] fallback place search', fallbackQuery);
              placeRes = await axios.get('/places',{ params:{ query: fallbackQuery } });
            }
            console.log('[ADD EVENT] Enrichment Response:', JSON.stringify(placeRes.data, null, 2));

            Object.assign(candidate, {
              imageUrl: placeRes.data.photoUrl ?? candidate.imageUrl,
              rating: placeRes.data.rating ?? candidate.rating,
              place_id: placeRes.data.place_id ?? candidate.place_id,
              description: placeRes.data.description ?? candidate.description,
              reviews: placeRes.data.reviews ?? candidate.reviews,
              bookingUrl: placeRes.data.bookingUrl ?? candidate.bookingUrl,
            });
          }catch(e: any){ warn('enrich failed', e.message); }

          const updatedCandidate = { ...candidate }; // ensure immutability
          const updated = draft.map((d, idx) => (idx === modalDayIdx ? { ...d, items: [...d.items, updatedCandidate] } : d));
          console.log('[ADD EVENT] Updated Itinerary:', JSON.stringify(updated, null, 2));
          setDraft(updated);
        } else {
          warn('AI returned JSON without a valid item');
          console.log('[ADD EVENT] No valid item found in parsed JSON.');
        }
      } else warn('No JSON found in AI reply');
    } catch(e:any) {
      warn('Add event failed', e.message);
    } finally {
      setIsAdding(false);
      setInputText('');
      setModalDayIdx(null);
    }
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.wrapper, { paddingBottom: insets.bottom + 16, paddingTop: insets.top + 12 }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} hitSlop={20}>
              <FontAwesome name="chevron-left" size={22} color={Colors.light.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Itinerary</Text>
            <LinearGradient
              colors={['#8E7CC3', '#6B5B95']}
              style={styles.doneBtn}
            >
              <Pressable onPress={handleSave} accessibilityLabel="Save" style={styles.doneBtnInner} hitSlop={20}>
                <FontAwesome name="floppy-o" size={18} color="#fff" />
                <Text style={styles.saveLabel}>Save</Text>
              </Pressable>
            </LinearGradient>
          </View>

          <FlatList
            data={draft}
            keyExtractor={(d) => d.day.toString()}
            renderItem={({ item: day, index: dayIdx }) => (
              <View style={styles.daySection}>
                <Text style={styles.dayHeader}>Day {day.day}</Text>
                <FlatList
                  data={day.items}
                  keyExtractor={(_, idx) => idx.toString()}
                  renderItem={({ item, index }) => (
                    <EventRow
                      item={item}
                      onDelete={handleDelete}
                      moveUp={() => {
                        if (index === 0) return;
                        setDraft(curr => curr.map((d,i)=> i===dayIdx ? { ...d, items: moveItem(d.items,index,index-1)}:d));
                      }}
                      moveDown={() => {
                        if (index === day.items.length-1) return;
                        setDraft(curr => curr.map((d,i)=> i===dayIdx ? { ...d, items: moveItem(d.items,index,index+1)}:d));
                      }}
                      movePrevDay={dayIdx>0 ? () => {
                        setDraft(curr => {
                          const copy=[...curr];
                          const itemObj = copy[dayIdx].items.splice(index,1)[0];
                          copy[dayIdx-1].items.push(itemObj);
                          return copy;
                        });
                      }: undefined}
                      moveNextDay={dayIdx<draft.length-1 ? () => {
                        setDraft(curr => {
                          const copy=[...curr];
                          const itemObj = copy[dayIdx].items.splice(index,1)[0];
                          copy[dayIdx+1].items.push(itemObj);
                          return copy;
                        });
                      }: undefined}
                      isFirst={index===0}
                      isLast={index===day.items.length-1}
                    />
                  )}
                />
                <Pressable style={styles.addBtn} onPress={() => handleAddEvents(dayIdx)}>
                  <FontAwesome name="plus" size={14} color={Colors.light.tint} />
                  <Text style={styles.addBtnText}>Add More Events</Text>
                </Pressable>
              </View>
            )}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>

        {/* Add events modal */}
        <Modal visible={modalDayIdx !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Describe what you'd like to add</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dinner at a rooftop restaurant"
                placeholderTextColor="#888"
                value={inputText}
                onChangeText={setInputText}
              />
              <View style={styles.modalActions}>
                <LinearGradient colors={['#8E7CC3', '#6B5B95']} style={styles.modalBtn}>
                  <Pressable onPress={confirmAddEvents} disabled={isAdding} style={styles.modalBtnInner}>
                    {isAdding ? <ActivityIndicator color="#fff" size={32} /> : <Text style={styles.modalBtnText}>Submit</Text>}
                  </Pressable>
                </LinearGradient>
                <Pressable style={[styles.modalBtn, { marginLeft: 8, backgroundColor: '#555' }]} onPress={() => setModalDayIdx(null)}>
                  <View style={styles.modalBtnInner}><Text style={styles.modalBtnText}>Cancel</Text></View>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper:{ flex:1, backgroundColor:'#FFFFFF', paddingHorizontal:16 },
  headerRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  headerTitle:{ color:Colors.light.text, fontSize:22, fontWeight:'bold', textAlign:'center', flex:1 },
  doneBtn:{ borderRadius: 20 },
  doneBtnInner: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  daySection:{ marginBottom:24 },
  dayHeader:{ color:Colors.light.text, fontSize:20, fontWeight:'bold', marginBottom:8 },
  row:{ flexDirection:'row', alignItems:'center', paddingVertical:10 },
  thumb:{ width:48, height:48, borderRadius:8, marginHorizontal:8, backgroundColor:'#e0e0e0' },
  title:{ color:Colors.light.text, fontSize:16, fontWeight:'600' },
  subtitle:{ color:'#555555', fontSize:12, marginTop:2 },
  separator:{ height:1, backgroundColor:'#222', marginLeft:40 },
  addBtn:{ flexDirection:'row', alignItems:'center', marginTop:8, alignSelf: 'flex-start' },
  addBtnText: { color:Colors.light.tint, marginLeft:6 },
  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center' },
  modalContent:{ backgroundColor:'#1E1E1E', padding:20, borderRadius:12, width:'90%' },
  modalTitle: { color: '#FFFFFF', fontSize:16, marginBottom:8 },
  input:{ backgroundColor:'#2A2A2A', borderRadius:8, padding:12, color:'#FFFFFF' },
  modalActions: { flexDirection: 'row', marginTop: 12 },
  modalBtn:{ flex:1, borderRadius:8 },
  modalBtnInner: { paddingVertical:12, alignItems:'center' },
  modalBtnText:{ color:'#FFFFFF', fontSize:16 },
  saveLabel:{ color:'#fff', fontSize:18, fontWeight:'bold', marginLeft:4 },
}); 