import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useChatSessions } from './ChatSessionContext';

export type Review = {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
};

export type ItineraryItem = {
  id?: string;
  title: string;
  // Either a single string range ("HH:MM–HH:MM") or normalized ISO fields below
  timeRange?: string;
  start?: string; // ISO string
  end?: string;   // ISO string
  imageUrl?: string;
  // Google Places permanent key for the item's primary photo
  photoReference?: string;
  // Pre-computed 400px CDN URL derived from photoReference
  thumbUrl?: string;
  rating?: number;
  distanceFromPrevious?: string;
  bookingUrl?: string;
  type: 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'RESTAURANT' | 'LODGING' | 'TRANSPORT';
  place_id?: string;
  description?: string;
  reviews?: Review[];
  city?: string;
  country?: string;
  neighborhood?: string;
};

export type DailyPlan = {
  day: number;
  date: string;
  items: ItineraryItem[];
};

interface ItineraryContextType {
  plans: DailyPlan[];
  setPlans: (p: DailyPlan[]) => void;
  tripCount: number;
  tripTitle: string | null;
  setTripTitle: (t: string | null) => void;
}

const ItineraryCtx = createContext<ItineraryContextType | null>(null);

export function ItineraryProvider({ children }: { children: ReactNode }) {
  const { currentSessionId } = useChatSessions();

  // Store per-session slices to avoid cross-chat bleed
  const [plansBySession, setPlansBySession] = useState<Record<string, DailyPlan[]>>({});
  const [titleBySession, setTitleBySession] = useState<Record<string, string | null>>({});

  const plans = plansBySession[currentSessionId] || [];
  const tripTitle = titleBySession[currentSessionId] ?? null;

  const setPlans = (p: DailyPlan[]) => {
    setPlansBySession(prev => ({ ...prev, [currentSessionId]: p }));
  };
  const setTripTitle = (t: string | null) => {
    setTitleBySession(prev => ({ ...prev, [currentSessionId]: t }));
  };

  const tripCount = useMemo(() => (plans.length > 0 ? 1 : 0), [plans]);

  return (
    <ItineraryCtx.Provider value={{ plans, setPlans, tripCount, tripTitle, setTripTitle }}>
      {children}
    </ItineraryCtx.Provider>
  );
}

export function useItinerary() {
  const ctx = useContext(ItineraryCtx);
  if (!ctx) {
    throw new Error('useItinerary must be used inside ItineraryProvider');
  }
  return ctx;
} 