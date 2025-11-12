/**
 * Build a Google Places photo URL with given maxpx. Falls back to Unsplash deterministic travel photo.
 */
export function buildPlacePhotoUrl(ref?: string, max: number = 400): string {
  // Mapbox mode: use Unsplash Source with a deterministic travel query
  const baseQuery = ref && ref.trim() !== '' ? ref : 'travel destination landmark';
  const url = `https://source.unsplash.com/${max}x${Math.round(
    (max * 3) / 4
  )}/?${encodeURIComponent(baseQuery)}`;
  // eslint-disable-next-line no-console
  console.log(`[IMG] buildPlacePhotoUrl: using Unsplash ${url.slice(0, 80)}…`);
  return url;
} 