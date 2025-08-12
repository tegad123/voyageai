import { useState, useCallback } from 'react';
import axios from '../api/axios';
import { log, warn, error as logError } from '../utils/log';
import Toast from 'react-native-toast-message';
import { useItinerary } from '../context/ItineraryContext';
import { useChatSessions } from '../context/ChatSessionContext';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
  const { currentSession, addMessage, updateMessage } = useChatSessions();

  const sendMessage = useCallback(async (content: string, opts?: { model?: string; suppressUserEcho?: boolean }) => {
    if (!opts?.suppressUserEcho) {
      addMessage('user', content);
    }

    setIsLoading(true);

    const userMessageForApi = { role: 'user' as const, content };
    const convoForRequest = [...currentSession.messages, userMessageForApi]
      .slice(-10)
      .map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content }));

    try {
      if (Platform.OS === 'web') {
        // Streaming on web via SSE
        const assistantId = addMessage('assistant', '');
        const resp = await fetch(`${axios.defaults.baseURL}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': axios.defaults.headers.common['Authorization'] as string,
          },
          body: JSON.stringify({ messages: convoForRequest, model: opts?.model }),
        });
        if (!resp.ok || !resp.body) throw new Error('Stream failed');
        const reader = resp.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let acc = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          acc += chunk;
          // SSE lines start with "data: " per server implementation
          const pieces = chunk.split('\n\n').filter(Boolean).map(s => s.replace(/^data:\s*/, ''));
          for (const p of pieces) {
            if (p === '[DONE]') break;
            updateMessage(assistantId, p, { mode: 'append' });
          }
        }
        // Fall-through post-processing: let the non-streaming parser run on acc if needed (optional)
        setIsLoading(false);
        return;
      }

      // Non-streaming (native)
      log('💬 Using non-streaming chat endpoint');
      const startTime = Date.now();
      const response = await axios.post('/chat', { messages: convoForRequest, model: opts?.model });
      const endTime = Date.now();
      log('✅ Response received:', response.status, 'in', endTime - startTime, 'ms');
      
      const rawContent = response.data.choices[0].message.content as string;

      let summaryContent = rawContent;
      summaryContent = summaryContent.replace(/[`~]{3}[\s\S]*?[`~]{3}/g, '');
      const fenceIdx = summaryContent.search(/[`~]{3}/);
      if (fenceIdx !== -1) summaryContent = summaryContent.slice(0, fenceIdx);
      const jsonIdx = summaryContent.search(/\{[\s\S]*?"itinerary"/i);
      if (jsonIdx !== -1) summaryContent = summaryContent.slice(0, jsonIdx);
      summaryContent = summaryContent.trim();
      addMessage('assistant', summaryContent);
      
      const cityMatch = /Your trip to ([^\n]+?) from/i.exec(summaryContent);
      if (cityMatch) setTripTitle(cityMatch[1].trim());
      
      let match = rawContent.match(/^[ \t]*([`~]{3})\s*json?\s*\n([\s\S]*?)\n[ \t]*\1/m) || rawContent.match(/^[ \t]*([`~]{3})\s*\n([\s\S]*?)\n[ \t]*\1/m);
      let jsonStr: string | null = null;
      if (match) jsonStr = match[2]; else {
        const braceStart = rawContent.indexOf('{');
        const braceEnd = rawContent.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) jsonStr = rawContent.slice(braceStart, braceEnd + 1);
      }
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed && parsed.itinerary) {
            const normalized = normalizePlans(parsed.itinerary);
            setPlans(normalized as any);
          }
        } catch {}
      }

    } catch (error: any) {
      logError('[CHAT ERROR]', error);
      let errorMessage = '🚫 An error occurred. Please try again.';
      if (error.response?.status === 502) errorMessage = '🔄 Server is starting up. Please wait a moment and try again.';
      else if (error.code === 'ECONNABORTED') errorMessage = '⏱️ Request timed out. Please try again.';
      else if (!error.response) errorMessage = '🌐 Network error. Please check your connection.';
      addMessage('assistant', errorMessage);
      Toast.show({ type: 'error', text1: 'Message Failed' });
    } finally {
      setIsLoading(false);
    }
  }, [currentSession.messages, addMessage, updateMessage, setPlans, setTripTitle]);

  return { isLoading, sendMessage };
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