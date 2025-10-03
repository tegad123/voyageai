import { useState, useCallback } from 'react';
import axios from '../api/axios';
import { log, warn, error as logError } from '../utils/log';
import Toast from 'react-native-toast-message';
import { useItinerary } from '../context/ItineraryContext';
import { useChatSessions } from '../context/ChatSessionContext';
import Constants from 'expo-constants';

// The useChat hook is now responsible ONLY for the API communication.
// All state management is handled by the ChatSessionContext.
export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const { setPlans, setTripTitle } = useItinerary();
  const { currentSession, addMessage, attachItinerary } = useChatSessions();

  const sendMessage = useCallback(async (content: string, opts?: { model?: string }) => {
    // Add user message to context immediately.
    addMessage('user', content);

    setIsLoading(true);

    // Build payload (last 15 turns + current)
    const userMessageForApi = { role: 'user' as const, content };
    const convoForRequest = [...currentSession.messages, userMessageForApi]
      .slice(-15)
      .map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content }));

    try {
      log('💬 Using non-streaming chat endpoint');
      log('🔍 Debug - API Base URL:', axios.defaults.baseURL);
      log('🔍 Debug - API Key being sent:', Constants.expoConfig?.extra?.apiKey || 'voyageai-secret');
      log('🔍 Debug - Request payload:', JSON.stringify({ messages: convoForRequest, model: opts?.model }));
      log('🔍 Debug - Request headers:', JSON.stringify(axios.defaults.headers));

      // Use non-streaming endpoint directly since React Native fetch streaming is unreliable
      log('🚀 Making POST request to /chat...');
      const startTime = Date.now();
      const response = await axios.post('/chat', { messages: convoForRequest, model: opts?.model });
      const endTime = Date.now();
      log('✅ Response received:', response.status);
      log('✅ Response time:', endTime - startTime, 'ms');
      log('✅ Response data keys:', Object.keys(response.data));
      log('✅ Response headers:', JSON.stringify(response.headers));
      
      const rawContent = response.data.choices[0].message.content as string;
      log('📝 Raw content length:', rawContent.length);
      log('📝 Raw content preview:', rawContent.substring(0, 100));

      let summaryContent = rawContent;
      
      // 1. Remove any complete fenced blocks
      summaryContent = summaryContent.replace(/[`~]{3}[\s\S]*?[`~]{3}/g, '');
      // 2. If there is an opening fence without a close, drop everything after it
      const fenceIdx = summaryContent.search(/[`~]{3}/);
      if (fenceIdx !== -1) {
        summaryContent = summaryContent.slice(0, fenceIdx);
      }
      // 3. If raw JSON appears without fences (starts with { and contains "itinerary"), strip it
      const jsonIdx = summaryContent.search(/\{[\s\S]*?"itinerary"/i);
      if (jsonIdx !== -1) {
        summaryContent = summaryContent.slice(0, jsonIdx);
      }
      // 4. Clean up markdown formatting
      summaryContent = summaryContent
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic *text*
        .replace(/#{1,6}\s+/g, '')       // Remove headers ### 
        .replace(/^\s*[-*+]\s+/gm, '')   // Remove bullet points
        .replace(/^\s*\d+\.\s+/gm, '')   // Remove numbered lists
        .trim();
      
      log('📝 Summary content length:', summaryContent.length);
      log('📝 Summary content preview:', summaryContent.substring(0, 100));
      
      // We'll attach itinerary (if present) atomically when adding the assistant message
      let itineraryToAttach: any | null = null;
      
      let match = rawContent.match(/^[ \t]*([`~]{3})\s*json?\s*\n([\s\S]*?)\n[ \t]*\1/m);
      if (!match) {
        match = rawContent.match(/^[ \t]*([`~]{3})\s*\n([\s\S]*?)\n[ \t]*\1/m);
      }
      let jsonStr: string | null = null;
      if (match) {
        jsonStr = match[2];
      } else {
        const braceStart = rawContent.indexOf('{');
        const braceEnd = rawContent.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
          jsonStr = rawContent.slice(braceStart, braceEnd + 1);
        }
      }
      if (jsonStr) {
        let parsed: any;
        try {
          parsed = JSON.parse(jsonStr);
          if (parsed && parsed.itinerary) {
            console.log('[USECAT] Parsed itinerary:', {
              daysCount: parsed.itinerary.length,
              sessionId: currentSession.id,
              messageCount: currentSession.messages.length
            });
            
            // Sort items within each day: LODGING first, then others by time
            const sortedItinerary = parsed.itinerary.map((day: any) => ({
              ...day,
              items: day.items.sort((a: any, b: any) => {
                // LODGING and HOTEL items always come first
                const aIsAccommodation = a.type === 'LODGING' || a.type === 'HOTEL';
                const bIsAccommodation = b.type === 'LODGING' || b.type === 'HOTEL';
                
                if (aIsAccommodation && !bIsAccommodation) return -1;
                if (bIsAccommodation && !aIsAccommodation) return 1;
                
                // If both are accommodations or both are not, sort by time
                const aTime = a.timeRange?.split('–')[0] || a.timeRange?.split('-')[0] || '00:00';
                const bTime = b.timeRange?.split('–')[0] || b.timeRange?.split('-')[0] || '00:00';
                return aTime.localeCompare(bTime);
              })
            }));
            
            // Set global plans for immediate display
            setPlans(sortedItinerary);
            
            // Extract trip title from content for itinerary
            let itineraryTitle = 'Your Trip';
            const titleMatch = /Your trip to ([^\n]+?) from/i.exec(summaryContent);
            if (titleMatch) {
              itineraryTitle = titleMatch[1].trim();
              setTripTitle(itineraryTitle);
            }
            
            // Prepare itinerary record for atomic attach
            const itineraryRecord = {
              id: `itinerary_${Date.now()}`,
              title: itineraryTitle,
              days: sortedItinerary,
              createdAt: Date.now(),
              chatMessageId: '',
              saved: false,
              chatSessionId: currentSession.id,
              status: 'draft' as const
            };
            itineraryToAttach = itineraryRecord;
            console.log('[USECAT] Prepared itinerary record for attach:', {
              id: itineraryRecord.id,
              title: itineraryRecord.title,
              daysCount: itineraryRecord.days.length
            });
          }
        } catch (e) {
          warn('JSON parsing failed after multiple attempts');
        }
      } else {
        log('[PLANS] no itinerary JSON found');
      }

      // Now add the assistant message, attaching itinerary atomically if available
      console.log('[USECHAT] About to add assistant message. itineraryToAttach:', !!itineraryToAttach);
      if (itineraryToAttach) {
        console.log('[USECHAT] itineraryToAttach details:', {
          id: itineraryToAttach.id,
          title: itineraryToAttach.title,
          daysCount: itineraryToAttach.days?.length,
          sessionId: itineraryToAttach.chatSessionId
        });
      }
      
      const assistantMsgId = addMessage('assistant', summaryContent, itineraryToAttach ? { itinerary: itineraryToAttach } : undefined);
      console.log('[USECHAT] Added assistant message with id:', assistantMsgId, 'attachedItinerary:', !!itineraryToAttach);
      
      // Force attachment as backup (should be redundant with atomic attach above)
      if (itineraryToAttach && assistantMsgId) {
        try {
          itineraryToAttach.chatMessageId = assistantMsgId;
          attachItinerary(assistantMsgId, itineraryToAttach);
          console.log('[USECHAT] Forced attach via attachItinerary for message:', assistantMsgId);
        } catch (e) {
          console.warn('[USECHAT] attachItinerary threw:', e);
        }
      }

    } catch (error: any) {
      logError('[CHAT ERROR]', error);
      logError('[CHAT ERROR] Message:', error.message);
      logError('[CHAT ERROR] Response:', error.response?.data);
      logError('[CHAT ERROR] Status:', error.response?.status);
      
      let errorMessage = '🚫 An error occurred. Please try again.';
      
      // Handle specific error types
      if (error.response?.status === 502) {
        errorMessage = '🔄 Server is starting up. Please wait a moment and try again.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '⏱️ Request timed out. Please try again.';
      } else if (!error.response) {
        errorMessage = '🌐 Network error. Please check your connection.';
      }
      
      addMessage('assistant', errorMessage);
      Toast.show({ type: 'error', text1: 'Message Failed' });
    } finally {
      setIsLoading(false);
    }
  }, [currentSession.messages, addMessage, setPlans, setTripTitle]);

  // The hook now returns the isLoading state and the sendMessage function.
  // Messages are consumed directly from the context in the UI component.
  return {
    isLoading,
    sendMessage,
  };
}

export async function testPing() {
  try {
    const response = await axios.get('/ping');
    log('✅ Ping successful:', response.data);
    return true;
  } catch (error) {
    logError('❌ Ping failed:', error);
    return false;
  }
} 