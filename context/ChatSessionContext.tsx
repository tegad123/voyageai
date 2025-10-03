import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
// @ts-ignore – uuid has its own types but TS sometimes fails to resolve in RN env
import { v4 as uuid } from 'uuid';
import { DailyPlan } from './ItineraryContext';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  itineraryId?: string;
};

export type ItineraryRecord = {
  id: string;
  title: string;
  days: DailyPlan[];
  createdAt: number;
  chatMessageId: string;
  saved: boolean;
  chatSessionId: string;
  image?: string;
  status: 'draft' | 'upcoming' | 'completed';
};

export type ChatSession = {
  id: string;
  title: string; // first user prompt or custom label
  createdAt: number;
  messages: ChatMessage[];
  itineraries: Record<string, ItineraryRecord>;
  activeItineraryId?: string;
};

interface ChatState {
  sessions: Record<string, ChatSession>;
  currentSessionId: string;
}

interface ChatContextValue extends ChatState {
  currentSession: ChatSession;
  // message & itinerary actions
  addMessage: (role: ChatMessage['role'], content: string, opts?: { itinerary?: ItineraryRecord }) => string;
  setActiveItinerary: (id: string | undefined) => void;
  saveItinerary: (id: string, saved: boolean) => void;
  updateItinerary: (id: string, updatedItinerary: ItineraryRecord) => void;
  newSession: () => void;
  switchSession: (id: string) => void;
  attachItinerary: (messageId: string, itinerary: ItineraryRecord) => void;
  updateStatus: (id: string, status: ItineraryRecord['status']) => void;
  deleteSession: (id: string) => void;
  deleteItinerary: (id: string) => void;
}

const STORAGE_KEY = 'voyageAI.chatSessions.v1';

const ChatSessionCtx = createContext<ChatContextValue | null>(null);

export function ChatSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>(() => {
    const initialId = uuid();
    return {
      sessions: {
        [initialId]: {
          id: initialId,
          title: 'New chat',
          createdAt: Date.now(),
          messages: [],
          itineraries: {},
        },
      },
      currentSessionId: initialId,
    };
  });

  /* --------------------------- persistence -------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setState(parsed);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  /* ----------------------------- actions ---------------------------- */
  function produce(fn: (draft: ChatState) => void) {
    setState(prev => {
      const clone: ChatState = JSON.parse(JSON.stringify(prev));
      fn(clone);
      return clone;
    });
  }

  const addMessage: ChatContextValue['addMessage'] = (role, content, opts) => {
    console.log('[CTX:addMessage] role=', role, 'len=', (content||'').length, 'attachItin=', !!opts?.itinerary);
    if (opts?.itinerary) {
      console.log('[CTX:addMessage] itinerary details:', {
        id: opts.itinerary.id,
        title: opts.itinerary.title,
        daysCount: opts.itinerary.days?.length
      });
    }
    const msgId = uuid();
    console.log('[CTX:addMessage] generated msgId:', msgId);
    
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (!session) {
        console.log('[CTX:addMessage] ERROR: no session found for id:', draft.currentSessionId);
        return;
      }
      console.log('[CTX:addMessage] session found:', session.id, 'messages:', session.messages.length);
      
      // if first message set title
      if (session.messages.length === 0 && role === 'user') {
        session.title = content.slice(0, 40);
      }
      const msg: ChatMessage = { id: msgId, role, content, createdAt: Date.now() };
      console.log('[CTX:addMessage] created message:', { id: msg.id, role: msg.role });
      
      if (opts?.itinerary) {
        const itin = opts.itinerary;
        console.log('[CTX:addMessage] attaching itinerary id=', itin.id, 'to message', msgId);
        session.itineraries[itin.id] = itin;
        msg.itineraryId = itin.id;
        console.log('[CTX:addMessage] set msg.itineraryId =', msg.itineraryId);
        console.log('[CTX:addMessage] session.itineraries now has keys:', Object.keys(session.itineraries));
      }
      session.messages.push(msg);
      console.log('[CTX:addMessage] pushed message, session now has', session.messages.length, 'messages');
      
      if (msg.itineraryId) {
        console.log('[CTX:addMessage] SUCCESS: itinerary attached on message', msgId, 'itineraryId:', msg.itineraryId);
      } else {
        console.log('[CTX:addMessage] NO ITINERARY: message', msgId, 'has no itineraryId');
      }
    });
    return msgId;
  };

  const setActiveItinerary: ChatContextValue['setActiveItinerary'] = id => {
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (session) session.activeItineraryId = id;
    });
  };

  const saveItinerary: ChatContextValue['saveItinerary'] = (id, saved) => {
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (session?.itineraries[id]) session.itineraries[id].saved = saved;
    });
  };

  const updateStatus: ChatContextValue['updateStatus'] = (id, status) => {
    console.log('[CTX:updateStatus] Attempting to update itinerary', id, 'to status', status);
    
    produce(draft => {
      // Search across ALL sessions, not just current one
      let found = false;
      
      for (const sessionId of Object.keys(draft.sessions)) {
        const session = draft.sessions[sessionId];
        if (session?.itineraries[id]) {
          console.log('[CTX:updateStatus] Found itinerary', id, 'in session', sessionId, 'current status:', session.itineraries[id].status);
          session.itineraries[id].status = status;
          console.log('[CTX:updateStatus] Updated itinerary', id, 'to status', status, 'in session', sessionId);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.error('[CTX:updateStatus] ERROR: Could not find itinerary', id, 'in any session');
        console.log('[CTX:updateStatus] Available sessions:', Object.keys(draft.sessions));
        console.log('[CTX:updateStatus] Available itineraries:', Object.keys(draft.sessions).map(sId => ({
          sessionId: sId,
          itineraries: Object.keys(draft.sessions[sId].itineraries)
        })));
      }
    });
  };

  const attachItinerary: ChatContextValue['attachItinerary'] = (messageId, itin) => {
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (!session) return;
      const msg = session.messages.find(m => m.id === messageId);
      if (!msg) return;
      session.itineraries[itin.id] = itin;
      msg.itineraryId = itin.id;
    });
  };

  const newSession = () => {
    const id = uuid();
    produce(draft => {
      draft.sessions[id] = {
        id,
        title: 'New chat',
        createdAt: Date.now(),
        messages: [],
        itineraries: {},
      };
      draft.currentSessionId = id;
    });
  };

  const switchSession = (id: string) => {
    if (state.sessions[id]) setState(prev => ({ ...prev, currentSessionId: id }));
  };

  const deleteSession: ChatContextValue['deleteSession'] = (id) => {
    produce(draft => {
      if (!draft.sessions[id]) return;
      delete draft.sessions[id];

      // if deleted current, switch to any remaining session or create new
      if (draft.currentSessionId === id) {
        const remaining = Object.keys(draft.sessions);
        if (remaining.length > 0) {
          draft.currentSessionId = remaining[0];
        } else {
          const newId = uuid();
          draft.sessions[newId] = {
            id: newId,
            title: 'New chat',
            createdAt: Date.now(),
            messages: [],
            itineraries: {},
          };
          draft.currentSessionId = newId;
        }
      }
    });
  };

  const updateItinerary: ChatContextValue['updateItinerary'] = (id, updatedItinerary) => {
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (session?.itineraries[id]) session.itineraries[id] = updatedItinerary;
    });
  };

  const deleteItinerary: ChatContextValue['deleteItinerary'] = (id) => {
    console.log('[CTX:deleteItinerary] Attempting to delete itinerary', id);
    
    produce(draft => {
      // Search across ALL sessions, not just current one
      let found = false;
      
      for (const sessionId of Object.keys(draft.sessions)) {
        const session = draft.sessions[sessionId];
        if (session?.itineraries[id]) {
          console.log('[CTX:deleteItinerary] Found itinerary', id, 'in session', sessionId);
          delete session.itineraries[id];
          console.log('[CTX:deleteItinerary] Deleted itinerary', id, 'from session', sessionId);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.error('[CTX:deleteItinerary] ERROR: Could not find itinerary', id, 'in any session');
        console.log('[CTX:deleteItinerary] Available sessions:', Object.keys(draft.sessions));
        console.log('[CTX:deleteItinerary] Available itineraries:', Object.keys(draft.sessions).map(sId => ({
          sessionId: sId,
          itineraries: Object.keys(draft.sessions[sId].itineraries)
        })));
      }
    });
  };

  const currentSession = state.sessions[state.currentSessionId];

  /* --------------------------- value obj --------------------------- */
  const ctxValue: ChatContextValue = {
    ...state,
    currentSession,
    addMessage,
    setActiveItinerary,
    saveItinerary,
    updateItinerary,
    newSession,
    switchSession,
    attachItinerary,
    updateStatus,
    deleteSession,
    deleteItinerary,
  };

  return <ChatSessionCtx.Provider value={ctxValue}>{children}</ChatSessionCtx.Provider>;
}

export function useChatSessions() {
  const ctx = useContext(ChatSessionCtx);
  if (!ctx) throw new Error('useChatSessions must be inside provider');
  return ctx;
} 