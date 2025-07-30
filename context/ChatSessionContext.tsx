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
    const msgId = uuid();
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (!session) return;
      // if first message set title
      if (session.messages.length === 0 && role === 'user') {
        session.title = content.slice(0, 40);
      }
      const msg: ChatMessage = { id: msgId, role, content, createdAt: Date.now() };
      if (opts?.itinerary) {
        const itin = opts.itinerary;
        session.itineraries[itin.id] = itin;
        msg.itineraryId = itin.id;
      }
      session.messages.push(msg);
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
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (session?.itineraries[id]) session.itineraries[id].status = status;
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
    produce(draft => {
      const session = draft.sessions[draft.currentSessionId];
      if (session?.itineraries[id]) {
        delete session.itineraries[id];
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