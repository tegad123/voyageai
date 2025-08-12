import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChat } from '../hooks/useChat';
import { useChatSessions } from '../context/ChatSessionContext';
import { useItinerary } from '../context/ItineraryContext';
import EditItineraryModal from './EditItineraryModal';
import FadeInView from './FadeInView';
import ItineraryList from './ItineraryList';
import { useLanguage } from '../context/LanguageContext';

// Lazy-load the bottom-sheet panel so native module initialises only when needed
const LazyItineraryPanel = lazy(() => import('./ItineraryPanel'));

export default function ChatUI() {
  const [inputText, setInputText] = useState('');
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [showItineraryPanel, setShowItineraryPanel] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  
  const { isLoading, sendMessage } = useChat();
  const { sessions, currentSession, switchSession, deleteSession, newSession, setActiveItinerary, addMessage } = useChatSessions();

  const { t } = useLanguage();
  const messages = currentSession.messages;

  const { plans, tripTitle } = useItinerary();

  // Automatically request final itinerary with GPT-4o once all 5 user answers are provided
  const [autoRequested, setAutoRequested] = useState(false);
  useEffect(() => {
    if (autoRequested || isLoading || plans.length > 0) return;
    const userCount = messages.filter(m => m.role === 'user').length;
    if (userCount >= 5) {
      setAutoRequested(true);
      sendMessage('Please create the final detailed itinerary now.', { model: 'gpt-4o', suppressUserEcho: true });
    }
  }, [messages, isLoading, plans.length]);

  // Auto-scroll to bottom only when new messages are added
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const messageText = inputText.trim();
    setInputText('');

    // Local fast-path: timeframe question for Day 1 (or "first day"): answer locally without sending to backend
    const timeQ = /(time\s*frame|schedule|what\s*time).*?(day\s*1|first\s*day)/i;
    if (timeQ.test(messageText)) {
      if (!plans || plans.length === 0) {
        addMessage('assistant', 'I don\'t see an itinerary saved yet. Create an itinerary first, then ask for Day 1\'s timeframe.');
        return;
      }
      const firstDay = plans[0];
      const items = firstDay.items || [];
      const formatClock = (v: string) => {
        if (!v) return '';
        if (v.includes('T')) {
          try { return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return v; }
        }
        return v;
      };
      const times = items
        .map(it => {
          if (it.start && it.end) return { start: formatClock(it.start), end: formatClock(it.end), title: it.title };
          if (it.timeRange) {
            const [s,e] = it.timeRange.split(/[–-]/);
            return { start: (s||'').trim(), end: (e||'').trim(), title: it.title };
          }
          return null;
        })
        .filter(Boolean) as { start: string; end: string; title: string }[];
      if (times.length === 0) {
        addMessage('assistant', 'Day 1 doesn\'t have explicit times yet. Want me to add standard 09:00–17:00 ranges?');
        return;
      }
      const lines = times.map(t => `• ${t.title}: ${t.start}–${t.end}`).join('\n');
      const reply = `On Day 1${tripTitle ? ` of your ${tripTitle} trip` : ''}, here are the timeframes:\n${lines}`;
      addMessage('assistant', reply);
      return;
    }
    
    // The useChat hook now handles adding the user message to the context.
    // No need to call addMessage here.
    await sendMessage(messageText);
  };

  const handleViewItinerary = () => {
    if (plans && plans.length > 0) {
      router.push('/itinerary');
    }
  };

  const handleSaveItinerary = () => {
    if (plans && plans.length > 0) {
      // Save to chat session context
      const itineraryId = `itinerary_${Date.now()}`;
      setActiveItinerary(itineraryId);
      setShowItineraryModal(false);
      Alert.alert('Success', 'Itinerary saved to your trips!');
    }
  };

  const handleToggleDrawer = () => {
    setShowDrawer(prev => !prev);
  };

  const handleSelectSession = (id: string) => {
    switchSession(id);
    setShowDrawer(false);
  };

  const handleDeleteSession = (id: string) => {
    if (Object.keys(sessions).length === 1) {
      Alert.alert('Cannot delete', 'At least one chat must remain.');
      return;
    }
    deleteSession(id);
  };

  const handleNewChat = () => {
    newSession();
    setShowDrawer(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isUser = item.role === 'user';
    const hasItinerary = item.itineraryId || (!isUser && plans && plans.length > 0);
    const cleanContent = (item.content || '').replace(/^#+\s*/gm, '').trim();
    return (
      <FadeInView delay={index * 10}>
        <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
              {cleanContent}
            </Text>
            
            {hasItinerary && plans && plans.length > 0 && (
              <View style={styles.itineraryCard}>
                <Text style={styles.itineraryTitle}>
                  {tripTitle || 'Your Trip'}
                </Text>
                <Text style={styles.itinerarySubtitle}>
                  {`${plans.length} day${plans.length !== 1 ? 's' : ''} • ${plans.reduce((acc, day) => acc + day.items.length, 0)} activities`}
                </Text>
                <TouchableOpacity 
                  style={styles.viewItineraryButton}
                  onPress={handleViewItinerary}
                >
                  <Text style={styles.viewItineraryButtonText}>View Itinerary</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </FadeInView>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <TouchableOpacity style={styles.menuButton} onPress={handleToggleDrawer}>
          <Ionicons name="menu" size={20} color="#6B5B95" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('Chat')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.tripsButton}
          onPress={() => router.push('/tabs/trips')}
        >
          <Ionicons name="briefcase" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Chat Content */}
      <View style={styles.chatContent}>
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>{t('Hello, where would you like to travel to?')}</Text>
            <Text style={styles.welcomeSubtitle}>
              {t('I can help you plan the perfect trip with personalized itineraries and recommendations.')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id || index.toString()}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6B5B95" />
            <Text style={styles.loadingText}>Planning your trip...</Text>
          </View>
        )}

        {/* auto-generation removed button */}
      </View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={t('Type a message…')}
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={inputText.trim() && !isLoading ? '#fff' : '#ccc'} 
          />
        </TouchableOpacity>
      </View>

      {/* Itinerary Modal */}
      <EditItineraryModal
        visible={showItineraryModal}
        plans={plans || []}
        tripTitle={tripTitle || 'Your Trip'}
        messages={messages}
        onSave={handleSaveItinerary}
        onClose={() => setShowItineraryModal(false)}
      />

      {/* Read-only Itinerary bottom-sheet */}
      {plans && plans.length > 0 && (
        <Suspense fallback={null}>
          <LazyItineraryPanel
            isOpen={showItineraryPanel}
            onClose={() => setShowItineraryPanel(false)}
          >
            <ItineraryList plans={plans} />
          </LazyItineraryPanel>
        </Suspense>
      )}


      {/* Drawer Modal */}
      <Modal visible={showDrawer} animationType="slide" transparent onRequestClose={handleToggleDrawer}>
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={handleToggleDrawer} />
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Chats</Text>
            <TouchableOpacity onPress={handleNewChat} style={styles.newChatBtn}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.drawerList}>
            {Object.values(sessions).map(s => (
              <View key={s.id} style={styles.sessionRow}>
                <TouchableOpacity style={{ flex:1 }} onPress={() => handleSelectSession(s.id)}>
                  <Text style={[styles.sessionTitle, s.id===currentSession.id && {color:'#6B5B95'}]} numberOfLines={1}>
                    {s.title || 'Untitled'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteSession(s.id)} hitSlop={12}>
                  <FontAwesome name="trash" size={16} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B5B95',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B5B95',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  /* --- Welcome view styles --- */
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B5B95',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },

  /* --- Messages list & bubbles --- */
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    marginVertical: 8,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  assistantMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#6B5B95',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#333333',
  },

  /* --- Itinerary card --- */
  itineraryCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B5B95',
    marginBottom: 4,
  },
  itinerarySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  viewItineraryButton: {
    backgroundColor: '#6B5B95',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewItineraryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  /* --- Loading indicator --- */
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#121212',
    fontSize: 16,
    marginRight: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B5B95',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: '#DDD',
  },
  generateButton: {
    backgroundColor: '#6B5B95',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  drawerOverlay: {
    position: 'absolute', top:0, bottom:0, left:0, right:0,
    backgroundColor:'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute', top:0, bottom:0, left:0,
    width: 280,
    backgroundColor:'#fff',
    paddingTop: 60,
    paddingHorizontal:12,
  },
  drawerHeader:{ flexDirection:'row', alignItems:'center', marginBottom:16 },
  drawerTitle:{ fontSize:20, fontWeight:'600', flex:1 },
  newChatBtn:{ backgroundColor:'#6B5B95', borderRadius:20, width:32, height:32, justifyContent:'center', alignItems:'center' },
  drawerList:{ flex:1 },
  sessionRow:{ flexDirection:'row', alignItems:'center', paddingVertical:12, borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:'#dedede' },
  sessionTitle:{ fontSize:16, color:'#333' },
}); 