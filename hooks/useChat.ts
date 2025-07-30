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
  const { currentSession, addMessage } = useChatSessions();

  const sendMessage = useCallback(async (content: string, opts?: { model?: string }) => {
    // Add user message to context immediately.
    addMessage('user', content);

    setIsLoading(true);

    // Build payload (last 15 turns + current)
    const userMessageForApi = { role: 'user' as const, content };
    const convoForRequest = [...currentSession.messages, userMessageForApi]
      .slice(-15)
      .map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content }));

    // Character buffer we will grow as tokens arrive
    let assistantBuffer = '';

    try {
      log('💬 Streaming chat to', axios.defaults.baseURL + '/chat/stream');

      const resp = await fetch(axios.defaults.baseURL + '/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.apiKey}`,
        },
        body: JSON.stringify({ messages: convoForRequest, model: opts?.model }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('stream-not-supported');
      }

      const reader = (resp.body as any).getReader?.();

      if (!reader) throw new Error('stream-not-supported');

      const decoder = new TextDecoder('utf-8');

      let doneReading = false;
      let partial = '';
      while (!doneReading) {
        const { value, done } = await reader.read();
        doneReading = done;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          partial += chunk;

          // Split SSE events (double newlines separate events)
          const events = partial.split('\n\n');
          // Keep last partial if not ended with double newline
          partial = events.pop() || '';

          for (const evt of events) {
            const dataLine = evt.trim().replace(/^data:\s*/, '');
            if (!dataLine) continue;
            if (dataLine === '[DONE]') {
              doneReading = true;
              break;
            }
            assistantBuffer += dataLine;
            // Currently we buffer tokens; UI will update once finished.
          }
        }
      }

      // Final parse of itinerary JSON (same as old logic)
      const rawContent = assistantBuffer;

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
            setPlans(parsed.itinerary);
          }
        } catch (e) {
          warn('JSON parsing failed after multiple attempts');
        }
      } else {
        log('[PLANS] no itinerary JSON found');
      }

    } catch (error: any) {
      if (error.message === 'stream-not-supported') {
        // Fallback to non-streaming endpoint
        try {
          log('↩️  Falling back to /chat');
          const response = await axios.post('/chat', { messages: convoForRequest, model: opts?.model });
          const rawContent = response.data.choices[0].message.content as string;
          // reuse downstream parsing by setting assistantBuffer
          assistantBuffer = rawContent;

          /* --- Process assistantBuffer same as streaming success --- */
          let summaryContent = rawContent;
          summaryContent = summaryContent.replace(/[`~]{3}[\s\S]*?[`~]{3}/g, '');
          const fenceIdxF = summaryContent.search(/[`~]{3}/);
          if (fenceIdxF !== -1) summaryContent = summaryContent.slice(0, fenceIdxF);
          const jsonIdxF = summaryContent.search(/\{[\s\S]*?"itinerary"/i);
          if (jsonIdxF !== -1) summaryContent = summaryContent.slice(0, jsonIdxF);
          summaryContent = summaryContent.trim();

          addMessage('assistant', summaryContent);

          const cityMatchF = /Your trip to ([^\n]+?) from/i.exec(summaryContent);
          if (cityMatchF) setTripTitle(cityMatchF[1].trim());

          let matchF = rawContent.match(/^[ \t]*([`~]{3})\s*json?\s*\n([\s\S]*?)\n[ \t]*\1/m);
          if (!matchF) matchF = rawContent.match(/^[ \t]*([`~]{3})\s*\n([\s\S]*?)\n[ \t]*\1/m);
          let jsonStrF: string | null = null;
          if (matchF) jsonStrF = matchF[2];
          else {
            const braceStartF = rawContent.indexOf('{');
            const braceEndF = rawContent.lastIndexOf('}');
            if (braceStartF !== -1 && braceEndF !== -1 && braceEndF > braceStartF) jsonStrF = rawContent.slice(braceStartF, braceEndF + 1);
          }
          if (jsonStrF) {
            try {
              const parsedF = JSON.parse(jsonStrF);
              if (parsedF && parsedF.itinerary) setPlans(parsedF.itinerary);
            } catch {}
          }
          /* --- end process --- */
          // (the rest of parsing happens after catch block)
        } catch (e) {
          logError('[CHAT FALLBACK ERR]', e);
          addMessage('assistant', '🚫 An error occurred. Please try again.');
          Toast.show({ type: 'error', text1: 'Message Failed' });
        }
      } else {
        logError('[CHAT ERROR]', error);
        const errorMessage = '🚫 An error occurred. Please try again.';
        addMessage('assistant', errorMessage);
        Toast.show({ type: 'error', text1: 'Message Failed' });
      }
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
    const r = await axios.get('/ping');
    log('📲 /ping →', r.status, r.data);
  } catch (e: any) {
    warn('📲 /ping ERR', e.message);
  }
} 