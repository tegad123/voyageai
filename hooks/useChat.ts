import { useState, useCallback } from 'react';
import axios from '../api/axios';
import { log, warn, error as logError } from '../utils/log';
import Toast from 'react-native-toast-message';
import { useItinerary } from '../context/ItineraryContext';
import { useChatSessions } from '../context/ChatSessionContext';
import Constants from 'expo-constants';

function parseTimeRangeToISO(dateISO: string, range: string) {
  // Accept formats like "09:00-17:00" or "09:00–17:00"
  const m = range.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (!m) return { start: undefined as string | undefined, end: undefined as string | undefined };
  const [_, s, e] = m;
  const pad = (t: string) => (t.length === 4 ? '0' + t : t);
  const sISO = new Date(`${dateISO}T${pad(s)}:00`).toISOString();
  const eISO = new Date(`${dateISO}T${pad(e)}:00`).toISOString();
  return { start: sISO, end: eISO };
}

function normalizePlans(raw: any): { day: number; date: string; items: any[] }[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((d: any, idx: number) => {
    const date = d.date || new Date(Date.now() + idx * 86400000).toISOString().slice(0, 10);
    const items = Array.isArray(d.items) ? d.items.map((it: any, j: number) => {
      const id = `${idx + 1}-${j + 1}-${(it.title || 'item').slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`;
      let start = it.start;
      let end = it.end;
      if ((!start || !end) && typeof it.timeRange === 'string') {
        const parsed = parseTimeRangeToISO(date, it.timeRange);
        start = start || parsed.start;
        end = end || parsed.end;
      }
      return { id, ...it, start, end };
    }) : [];
    return { day: d.day || idx + 1, date, items };
  });
}

// The useChat hook is now responsible ONLY for the API communication.
// All state management is handled by the ChatSessionContext.
export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const { setPlans, setTripTitle } = useItinerary();
  const { currentSession, addMessage } = useChatSessions();

  const sendMessage = useCallback(async (content: string, opts?: { model?: string; suppressUserEcho?: boolean }) => {
    // Optionally avoid echoing synthetic trigger messages into the chat UI
    if (!opts?.suppressUserEcho) {
      addMessage('user', content);
    }

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
      summaryContent = summaryContent.trim();
      
      log('📝 Summary content length:', summaryContent.length);
      log('📝 Summary content preview:', summaryContent.substring(0, 100));
      
      // Add the assistant's message to the context.
      // This will trigger a re-render showing the assistant's response.
      addMessage('assistant', summaryContent);
      
      const cityMatch = /Your trip to ([^\n]+?) from/i.exec(summaryContent);
      if (cityMatch) {
        setTripTitle(cityMatch[1].trim());
      }
      
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
            log('[PLANS] parsed', parsed.itinerary.length, 'days');
            const normalized = normalizePlans(parsed.itinerary);
            setPlans(normalized as any);
          }
        } catch (e) {
          warn('JSON parsing failed after multiple attempts');
        }
      } else {
        log('[PLANS] no itinerary JSON found');
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