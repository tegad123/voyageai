import React, { useState, useRef, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useChat } from '../hooks/useChat';
import { useChatSessions } from '../context/ChatSessionContext';
import { useItinerary } from '../context/ItineraryContext';
import EditItineraryModal from './EditItineraryModal';
import ItineraryTabs from './ItineraryTabs';
import FadeInView from './FadeInView';
// MapPanel import removed
import { useLanguage } from '../context/LanguageContext';
import ShortSurveyModal from '../src/features/feedback/ShortSurveyModal';
import { incrementItineraryCount, shouldShowSurvey } from '../src/features/feedback/itineraryCounter';
import { parseISO, format } from 'date-fns';

// Removed bottom-sheet itinerary panel (revert to build 87 behavior)

export default function ChatUI() {
  const [inputText, setInputText] = useState('');
  const [showItineraryView, setShowItineraryView] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyItineraryId, setSurveyItineraryId] = useState<string | undefined>();
  const [currentItineraryData, setCurrentItineraryData] = useState<{title: string, days: any[]} | null>(null);
  const [showItineraryEdit, setShowItineraryEdit] = useState(false);
  // Map functionality removed
  const [isItinerarySaved, setIsItinerarySaved] = useState(false);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [isOpeningItinerary, setIsOpeningItinerary] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  
  const { isLoading, sendMessage } = useChat();
  const { sessions, currentSession, switchSession, deleteSession, newSession, setActiveItinerary, renameSession } = useChatSessions();

  const { t } = useLanguage();
  const messages = currentSession.messages;

  const { plans, tripTitle, setPlans, setTripTitle } = useItinerary();
  
  // Debug logs removed to prevent performance issues

  // Map functionality removed
  
  // REMOVED: Cleanup effect that was clearing global plans (needed for original UI)

  // Removed auto-submit logic: wait for explicit user request only
  useEffect(() => {
    console.log('[CHAT_UI] Auto-submit disabled. Message counts:', {
      user: messages.filter(m => m.role === 'user').length,
      assistant: messages.filter(m => m.role === 'assistant').length,
    });
  }, [messages]);

  // Auto-scroll to bottom only when new messages are added
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Removed debug logs to prevent infinite re-render loops that cause freezing

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const messageText = inputText.trim();
    setInputText('');
    await sendMessage(messageText);
  };

  const handleViewItinerary = (itineraryData: {title: string, days: any[]}) => {
    try {
      // Prevent multiple rapid taps
      if (isOpeningItinerary) {
        console.log('[CHAT_UI] Already opening itinerary, ignoring tap');
        return;
      }
      
      setIsOpeningItinerary(true);
      
      console.log('[CHAT_UI] handleViewItinerary called with:', {
        title: itineraryData.title,
        daysCount: itineraryData.days?.length
      });
      
      // Validate itinerary data
      if (!itineraryData || !itineraryData.days || itineraryData.days.length === 0) {
        console.error('[CHAT_UI] Invalid itinerary data:', itineraryData);
        Alert.alert('Error', 'Invalid itinerary data');
        setIsOpeningItinerary(false);
        return;
      }
      
      setCurrentItineraryData(itineraryData);
      
      // Always start as unsaved - user must manually save
      setIsItinerarySaved(false);
      setSavedItineraryId(null);
      
      setShowItineraryView(true);
      console.log('[CHAT_UI] Modal state set to true, starting with unsaved state');
      
      // Reset the opening flag after a delay
      setTimeout(() => setIsOpeningItinerary(false), 1000);
    } catch (error) {
      console.error('[CHAT_UI] Error in handleViewItinerary:', error);
      Alert.alert('Error', 'Failed to open itinerary view');
      setIsOpeningItinerary(false);
    }
  };

  const checkIfItinerarySaved = (itineraryData: {title: string, days: any[]}) => {
    // NEW LOGIC: Always start as unsaved - user must manually save
    // Don't auto-detect saved status to avoid confusion
    console.log('[CHAT_UI] checkIfItinerarySaved: Always returning false - user must manually save');
    return false;
  };

  const handleSaveItineraryFromView = async () => {
    try {
      if (!currentItineraryData || currentItineraryData.days.length === 0) {
        Alert.alert('Error', 'No itinerary to save');
        return;
      }

      if (isItinerarySaved && savedItineraryId) {
        // Toggle off - remove the specific saved itinerary
        if (currentSession.itineraries[savedItineraryId]) {
          delete currentSession.itineraries[savedItineraryId];
          console.log('[CHAT_UI] Removed itinerary:', savedItineraryId);
        }
        
        setIsItinerarySaved(false);
        setSavedItineraryId(null);
        Alert.alert('Removed', 'Itinerary removed from your trips');
      return;
    }
    
      // --- Create proper itinerary record like in app/itinerary.tsx ---
      const plans = currentItineraryData.days;
      
      // Determine location/title from the itinerary data
      let location: string | null = currentItineraryData.title || null;
      
      if (!location || location === 'Your Trip') {
        const firstItem = plans?.[0]?.items?.[0];
        if (firstItem) {
          // Try to extract destination from first item
          if ((firstItem as any).destinationCity) {
            location = (firstItem as any).destinationCity;
          } else if (firstItem.title) {
            const t = firstItem.title;
            const inMatch = t.match(/\bin\s+([A-Za-z\s]+)/i);
            const toMatch = t.match(/\bto\s+([A-Za-z\s]+)/i);
            if (inMatch) location = inMatch[1].trim();
            else if (toMatch) location = toMatch[1].trim();
            else {
              // fallback: use the title itself or last word
              const words = t.split(/\s+/);
              location = words.length > 1 ? words[words.length - 1] : t;
            }
          }
        }
      }

      location = (location || 'Trip').replace(/^[\s,]+|[\s,]+$/g, '');

      // Create date range string
      const startISO = plans[0].date;
      const endISO = plans[plans.length - 1].date;
      let title = location;
      
      if (startISO && endISO) {
        try {
          const startStr = format(parseISO(startISO), 'MMM d');
          const endStr = format(parseISO(endISO), 'MMM d');
          title = `${location} • ${startStr} – ${endStr}`;
        } catch {
          // If date parsing fails, just use location
          title = location;
        }
      }

      // Pick thumbnail from first available image
      let thumb: string | undefined;
      outer: for (const day of plans) {
        for (const item of day.items) {
          if (item.thumbUrl || item.imageUrl) {
            thumb = item.thumbUrl || item.imageUrl;
            break outer;
          }
        }
      }

      // Check if we're updating an existing itinerary or creating a new one
      let itineraryRecord;
      if (isItinerarySaved && savedItineraryId && currentSession.itineraries[savedItineraryId]) {
        // Update existing itinerary
        itineraryRecord = {
          ...currentSession.itineraries[savedItineraryId],
          title,
          days: plans,
          image: thumb,
          createdAt: currentSession.itineraries[savedItineraryId].createdAt, // Keep original creation time
        };
        console.log('[CHAT_UI] Updating existing itinerary:', savedItineraryId);
      } else {
        // Create new itinerary
        itineraryRecord = {
          id: `itinerary_${Date.now()}`,
          title,
          days: plans,
          image: thumb,
          createdAt: Date.now(),
          chatMessageId: '',
          saved: true,
          chatSessionId: currentSession.id,
          status: 'draft' as const
        };
        console.log('[CHAT_UI] Creating new itinerary:', itineraryRecord.id);
      }

      // Save to context - add to current session's itineraries
      currentSession.itineraries[itineraryRecord.id] = itineraryRecord;
      setActiveItinerary(itineraryRecord.id);
      setIsItinerarySaved(true);
      setSavedItineraryId(itineraryRecord.id);
      
      // Ensure the last assistant message has the itinerary attached
      const lastAssistantMessage = currentSession.messages
        .slice()
        .reverse()
        .find(m => m.role === 'assistant');
      
      if (lastAssistantMessage && !lastAssistantMessage.itineraryId) {
        console.log('[CHAT_UI] Attaching itinerary to message:', lastAssistantMessage.id);
        lastAssistantMessage.itineraryId = itineraryRecord.id;
        itineraryRecord.chatMessageId = lastAssistantMessage.id;
      }
      
      Alert.alert('Success', `"${title}" saved to your trips!`);
      
      // Survey trigger
      try {
        const count = await incrementItineraryCount();
        if (shouldShowSurvey(count)) {
          setSurveyItineraryId(itineraryRecord.id);
          setShowSurvey(true);
        }
      } catch (error) {
        console.warn('[CHAT_UI] Survey trigger failed:', error);
      }
    } catch (error) {
      console.error('[CHAT_UI] Error saving itinerary:', error);
      Alert.alert('Error', 'Failed to save itinerary');
    }
  };

  const handleSaveItinerary = async () => {
    if (plans && plans.length > 0) {
      const itineraryId = `itinerary_${Date.now()}`;
      setActiveItinerary(itineraryId);
      setShowItineraryView(false);
      Alert.alert('Success', 'Itinerary saved to your trips!');
      // Survey trigger
      try {
        const count = await incrementItineraryCount();
        if (shouldShowSurvey(count)) {
          setSurveyItineraryId(itineraryId);
          setShowSurvey(true);
        }
      } catch {}
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

  const handleRenameStart = (sessionId: string, currentTitle: string) => {
    setRenamingSessionId(sessionId);
    setRenameText(currentTitle);
  };

  const handleRenameConfirm = () => {
    if (renamingSessionId && renameText.trim()) {
      renameSession(renamingSessionId, renameText.trim());
    }
    setRenamingSessionId(null);
    setRenameText('');
  };

  const handleRenameCancel = () => {
    setRenamingSessionId(null);
    setRenameText('');
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isUser = item.role === 'user';
    
    // FIX: Only show itinerary card on the message that has an itinerary attached
    const hasItinerary = !!item.itineraryId;
    const cleanContent = (item.content || '').replace(/^#+\s*/gm, '').trim();
    return (
      <FadeInView delay={index * 10}>
        <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
          <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
                {cleanContent}
              </Text>
            
            {hasItinerary && (() => {
              const msgItin = currentSession.itineraries[item.itineraryId!];
              const days = msgItin?.days || [];
              if (!msgItin || days.length === 0) return null;
              return (
              <View style={styles.itineraryCard}>
                  <Text style={styles.itineraryTitle}>{msgItin.title || 'Your Trip'}</Text>
                <Text style={styles.itinerarySubtitle}>
                    {`${days.length} day${days.length !== 1 ? 's' : ''} • ${days.reduce((a,d)=>a+d.items.length,0)} activities`}
                </Text>
                  <TouchableOpacity 
                    style={styles.viewItineraryButton}
                    onPress={() => {
                      try {
                        // Validate data before proceeding
                        if (!days || days.length === 0) {
                          Alert.alert('Error', 'No itinerary data available');
                          return;
                        }
                        
                        // Set global state first
                        setPlans(days);
                        setTripTitle(msgItin.title);
                        
                        // Small delay to prevent race conditions
                        setTimeout(() => {
                          handleViewItinerary({
                            title: msgItin.title || 'Your Trip',
                            days: days
                          });
                        }, 50);
                      } catch (error) {
                        console.error('[CHAT_UI] Error opening itinerary:', error);
                        Alert.alert('Error', 'Failed to open itinerary');
                      }
                    }}
                  >
                    <Text style={styles.viewItineraryButtonText}>View Itinerary</Text>
                  </TouchableOpacity>
              </View>
              );
            })()}
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


      {/* Itinerary View Modal - Original UI */}
      <Modal 
        visible={showItineraryView} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowItineraryView(false);
          setShowItineraryEdit(false);
          // Map functionality removed
          setTimeout(() => {
            setCurrentItineraryData(null);
            setIsItinerarySaved(false);
            setSavedItineraryId(null);
          }, 100);
        }}
      >
        <View style={styles.itineraryViewContainer}>
          {/* Header with save and edit buttons - Original UI */}
          <View style={styles.itineraryViewHeader}>
            <TouchableOpacity 
              onPress={() => {
                // Close modal but preserve itinerary data for potential re-opening
                setShowItineraryView(false);
                
                // Reset modal-specific states
                setShowItineraryEdit(false);
                // Map functionality removed
                
                // Clear current data after a brief delay to prevent state issues
                setTimeout(() => {
                  setCurrentItineraryData(null);
                  setIsItinerarySaved(false);
                  setSavedItineraryId(null);
                }, 100);
              }} 
              style={styles.headerNavBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#6B5B95" />
            </TouchableOpacity>
            <Text style={styles.itineraryViewTitle}>{currentItineraryData?.title || 'Your Trip'}</Text>
            <View style={styles.headerActions}>
              {/* Map button removed */}
              <TouchableOpacity onPress={handleSaveItineraryFromView} style={styles.headerNavBtn}>
                <Ionicons 
                  name={isItinerarySaved ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={isItinerarySaved ? "#6B5B95" : "#6B5B95"} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => {
                  console.log('[EDIT_BTN] Pressed. currentItineraryData:', !!currentItineraryData);
                  console.log('[EDIT_BTN] Days:', currentItineraryData?.days?.length);
                  
                  if (currentItineraryData?.days && currentItineraryData.days.length > 0) {
                    // Set global plans for the edit modal
                    setPlans(currentItineraryData.days);
                    setTripTitle(currentItineraryData.title || 'Your Trip');
                    
                    console.log('[EDIT_BTN] Opening edit modal');
                    // Directly open edit modal without closing itinerary view first
                    setShowItineraryEdit(true);
                  } else {
                    console.log('[EDIT_BTN] No itinerary data available');
                    Alert.alert('Error', 'No itinerary data to edit');
                  }
                }} 
                style={styles.headerNavBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={20} color="#6B5B95" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Itinerary tabs - Original UI with safety check */}
          {currentItineraryData && currentItineraryData.days && currentItineraryData.days.length > 0 ? (
            <ItineraryTabs plans={currentItineraryData.days} />
          ) : (
            <View style={styles.emptyItinerary}>
              <Text style={styles.emptyText}>No itinerary data available</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Edit modal - simplified flow */}
      {showItineraryEdit && (
        <EditItineraryModal
          visible={showItineraryEdit}
          plans={currentItineraryData?.days || []}
          tripTitle={currentItineraryData?.title || 'Your Trip'}
          messages={messages}
          onSave={(updatedPlans) => {
            // Update the current itinerary data with the edited plans
            if (currentItineraryData) {
              setCurrentItineraryData({
                ...currentItineraryData,
                days: updatedPlans
              });
            }
          }}
          onClose={() => {
            setShowItineraryEdit(false);
          }}
        />
      )}
      
      {/* Debug info removed */}

      {/* Removed bottom-sheet: itinerary is shown on a separate screen (build 87) */}

      {/* Drawer Modal */}
      <Modal visible={showDrawer} animationType="slide" transparent onRequestClose={handleToggleDrawer}>
        <TouchableOpacity style={styles.drawerOverlay} activeOpacity={1} onPress={handleToggleDrawer} />
        <View style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>{t('Chats')}</Text>
            <TouchableOpacity onPress={handleNewChat} style={styles.newChatBtn}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.drawerList}>
            {Object.values(sessions).map(s => (
              <View key={s.id} style={styles.sessionRow}>
                {renamingSessionId === s.id ? (
                  // Rename mode
                  <View style={styles.renameContainer}>
                    <TextInput
                      style={styles.renameInput}
                      value={renameText}
                      onChangeText={setRenameText}
                      placeholder="Chat title"
                      placeholderTextColor="#999"
                      autoFocus
                      onSubmitEditing={handleRenameConfirm}
                    />
                    <TouchableOpacity onPress={handleRenameConfirm} style={styles.renameBtn}>
                      <FontAwesome name="check" size={14} color="#28a745" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRenameCancel} style={styles.renameBtn}>
                      <FontAwesome name="times" size={14} color="#e74c3c" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Normal mode
                  <>
                    <TouchableOpacity style={{ flex:1 }} onPress={() => handleSelectSession(s.id)}>
                      <Text style={[styles.sessionTitle, s.id===currentSession.id && {color:'#6B5B95'}]} numberOfLines={1}>
                        {s.title || 'Untitled'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRenameStart(s.id, s.title || 'Untitled')} hitSlop={12} style={styles.actionBtn}>
                      <FontAwesome name="edit" size={14} color="#6B5B95" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteSession(s.id)} hitSlop={12} style={styles.actionBtn}>
                      <FontAwesome name="trash" size={14} color="#e74c3c" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Map functionality removed */}

      {/* Survey Modal */}
      <ShortSurveyModal visible={showSurvey} onClose={() => setShowSurvey(false)} itineraryId={surveyItineraryId} />
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
  /* --- Itinerary View Modal - Original UI Styles --- */
  itineraryViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  itineraryViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 50, // Account for status bar
    backgroundColor: '#FFFFFF',
  },
  itineraryViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B5B95',
    flex: 1,
    textAlign: 'center',
  },
  headerNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyItinerary: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  actionBtn:{ marginLeft: 8, padding: 4 },
  renameContainer:{ flex: 1, flexDirection: 'row', alignItems: 'center' },
  renameInput:{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, fontSize: 14, color: '#333' },
  renameBtn:{ marginLeft: 8, padding: 4 },
}); 