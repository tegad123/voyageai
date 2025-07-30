import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1)
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema),
  model: z.string().optional(),
});

export const ItinerarySchema = z.object({
  title: z.string().min(1),
  description: z.string()
});

export const ItineraryUpdateSchema = ItinerarySchema.partial();

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ItineraryCreate = z.infer<typeof ItinerarySchema>;
export type ItineraryUpdate = z.infer<typeof ItineraryUpdateSchema>; 