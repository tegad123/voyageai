import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNT_KEY = 'itinerary_count_v1';

export async function getItineraryCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(COUNT_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export async function incrementItineraryCount(): Promise<number> {
  const current = await getItineraryCount();
  const next = current + 1;
  await AsyncStorage.setItem(COUNT_KEY, String(next));
  return next;
}

export function shouldShowSurvey(count: number): boolean {
  return count > 0 && count % 3 === 0;
}
