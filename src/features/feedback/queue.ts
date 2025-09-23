import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendFeedback, type FeedbackPayload } from './sendFeedback';

const KEY = 'feedback_queue_v1';

export async function enqueueFeedback(item: FeedbackPayload): Promise<void> {
  const raw = (await AsyncStorage.getItem(KEY)) || '[]';
  const list: FeedbackPayload[] = JSON.parse(raw);
  list.push(item);
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function flushFeedbackQueue(): Promise<void> {
  const raw = (await AsyncStorage.getItem(KEY)) || '[]';
  const list: FeedbackPayload[] = JSON.parse(raw);
  if (!list.length) return;

  const remaining: FeedbackPayload[] = [];
  for (const item of list) {
    const ok = await sendFeedback(item);
    if (!ok) remaining.push(item);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(remaining));
}
