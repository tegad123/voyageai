/**
 * Build a Google Places photo URL with given maxpx. Falls back to Unsplash deterministic travel photo.
 */
export function buildPlacePhotoUrl(ref?: string, max: number = 400): string {
  if (!ref || ref.trim() === '') {
    const fallback = `https://source.unsplash.com/random/${max}x${max}?travel`;
    // eslint-disable-next-line no-console
    console.warn(`[IMG] buildPlacePhotoUrl: missing photoReference, using Unsplash fallback ${fallback}`);
    return fallback;
  }
  const key = process.env.EXPO_PUBLIC_PLACES_KEY || process.env.GOOGLE_PLACES_KEY || '';
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${max}&photo_reference=${ref}&key=${key}`;
  // eslint-disable-next-line no-console
  console.log(`[IMG] buildPlacePhotoUrl: using Google photo ${url.slice(0, 80)}…`);
  return url;
} 