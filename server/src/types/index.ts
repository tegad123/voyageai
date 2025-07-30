export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
} 