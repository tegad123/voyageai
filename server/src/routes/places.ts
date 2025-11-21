import { Router } from 'express';
import axios from 'axios';

const router = Router();

interface GPhoto {
  photo_reference: string;
}

interface TextSearchResult {
  place_id: string;
  rating?: number;
  photos?: GPhoto[];
}

interface Review {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
}

const getFeatureCenter = (feature: any): [number | undefined, number | undefined] => {
  if (!feature) return [undefined, undefined];
  const directCenter = Array.isArray(feature.center) ? feature.center : undefined;
  const geometryCenter = Array.isArray(feature.geometry?.coordinates)
    ? feature.geometry.coordinates
    : undefined;
  const candidate = directCenter || geometryCenter;

  const lng = typeof candidate?.[0] === 'number' ? candidate[0] : undefined;
  const lat = typeof candidate?.[1] === 'number' ? candidate[1] : undefined;
  return [lng, lat];
};

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT || 'VoyageAIPlaces/1.0 (+support@voyageai.app)';
const NOMINATIM_EMAIL = process.env.NOMINATIM_EMAIL;
const FOURSQUARE_API_BASE = 'https://places-api.foursquare.com';
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
// Enable Foursquare photos by default if API key is present
const USE_FOURSQUARE_PHOTOS = process.env.USE_FOURSQUARE_PHOTOS !== 'false' && !!FOURSQUARE_API_KEY;

const buildUnsplashUrl = (seed: string, width: number, height: number) => {
  const sanitizedSeed = encodeURIComponent(seed || 'travel destination');
  return `https://source.unsplash.com/${width}x${height}/?${sanitizedSeed}`;
};

async function fetchPexelsPhoto(query: string): Promise<{ url: string; thumb: string } | null> {
  if (!PEXELS_API_KEY) return null;
  
  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: PEXELS_API_KEY },
      timeout: 5000,
    });
    
    const photo = response.data?.photos?.[0];
    if (!photo) return null;
    
    return {
      url: photo.src?.large || photo.src?.original,
      thumb: photo.src?.medium || photo.src?.small,
    };
  } catch (err: any) {
    console.warn('[PEXELS] Photo fetch failed:', err?.message);
    return null;
  }
}

type CachedPhoto = FoursquarePhotoResult & { expiresAt: number };
const photoCache = new Map<string, CachedPhoto>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours - reduce API calls

async function buildFallbackPlace(query: string) {
  const normalizedQuery = (query || '').trim();
  if (!normalizedQuery) {
    return null;
  }

  const fallbackSeed = normalizedQuery.replace(/\s+/g, ' ');
  const fallbackPhoto = buildUnsplashUrl(fallbackSeed, 800, 600);
  const fallbackThumb = buildUnsplashUrl(fallbackSeed, 400, 300);

  try {
    const params: Record<string, string | number> = {
      format: 'json',
      q: fallbackSeed,
      addressdetails: 1,
      limit: 1,
    };
    if (NOMINATIM_EMAIL) {
      params.email = NOMINATIM_EMAIL;
    }
    const nominatimResp = await axios.get(NOMINATIM_ENDPOINT, {
      params,
      headers: {
        'User-Agent': NOMINATIM_USER_AGENT,
      },
      timeout: 6000,
    });

    const candidate = Array.isArray(nominatimResp.data) ? nominatimResp.data[0] : undefined;
    if (candidate) {
      const lat = candidate.lat ? Number(candidate.lat) : undefined;
      const lng = candidate.lon ? Number(candidate.lon) : undefined;
      return {
        place_id: candidate.place_id?.toString() || `fallback-${Date.now()}`,
        description: candidate.display_name || fallbackSeed,
        photoUrl: fallbackPhoto,
        thumbUrl: fallbackThumb,
        reviews: [] as Review[],
        lat,
        lng,
        rating: undefined,
        bookingUrl: undefined,
        sources: ['OpenStreetMap Nominatim', 'Unsplash'],
        fallback: true,
      };
    }
  } catch (fallbackError: any) {
    console.warn('[PLACES] fallback lookup failed', fallbackError?.message);
  }

  return {
    place_id: `fallback-${Date.now()}`,
    description: fallbackSeed,
    photoUrl: fallbackPhoto,
    thumbUrl: fallbackThumb,
    reviews: [] as Review[],
    rating: undefined,
    bookingUrl: undefined,
    sources: ['Unsplash'],
    fallback: true,
  };
}

interface FoursquarePhotoResult {
  photoUrl: string;
  thumbUrl: string;
  attribution?: string;
  fsq_id?: string;
  source?: string;
}

async function fetchFoursquarePhoto(
  placeName: string,
  lat?: number,
  lng?: number
): Promise<FoursquarePhotoResult | null> {
  if (
    !USE_FOURSQUARE_PHOTOS ||
    !FOURSQUARE_API_KEY ||
    typeof lat !== 'number' ||
    typeof lng !== 'number'
  ) {
    return null;
  }

  const cacheKey = `${(placeName || '').toLowerCase()}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
  const existing = photoCache.get(cacheKey);
  if (existing && existing.expiresAt > Date.now()) {
    console.log('[FOURSQUARE] Cache hit:', cacheKey);
    return existing;
  } else if (existing) {
    photoCache.delete(cacheKey);
  }

  console.log('[FOURSQUARE] Fetching photo for:', placeName, `(${lat},${lng})`);

  try {
    const searchParams: Record<string, string | number> = {
      ll: `${lat},${lng}`,
      limit: 3,
      sort: 'RELEVANCE',
      radius: 5000,
    };

    if (placeName) {
      searchParams.query = placeName;
    }

    const searchResp = await axios.get(`${FOURSQUARE_API_BASE}/places/search`, {
      params: searchParams,
      headers: {
        Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
        Accept: 'application/json',
        'X-Places-Api-Version': '2025-06-17',
      },
      timeout: 6000,
    });

    const bestMatch = searchResp.data?.results?.[0];
    const fsqId = bestMatch?.fsq_place_id || bestMatch?.fsq_id;
    if (!fsqId) {
      return null;
    }

    const photosResp = await axios.get(`${FOURSQUARE_API_BASE}/places/${fsqId}/photos`, {
      params: { limit: 1, sort: 'POPULAR' },
      headers: {
        Authorization: `Bearer ${FOURSQUARE_API_KEY}`,
        Accept: 'application/json',
        'X-Places-Api-Version': '2025-06-17',
      },
      timeout: 6000,
    });

    const photo = Array.isArray(photosResp.data) ? photosResp.data[0] : null;
    if (!photo?.prefix || !photo?.suffix) {
      return null;
    }

    const buildSized = (w: number, h: number) => `${photo.prefix}${w}x${h}${photo.suffix}`;
    const photoUrl = buildSized(800, 600);
    const thumbUrl = buildSized(400, 300);

    const result: FoursquarePhotoResult = {
      photoUrl,
      thumbUrl,
      attribution: photo?.source?.name
        ? `Photo via Foursquare (${photo.source.name})`
        : 'Photo via Foursquare',
      fsq_id: fsqId,
      source: 'Foursquare Places Photos',
    };

    photoCache.set(cacheKey, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
    console.log('[FOURSQUARE] Photo fetched and cached successfully');
    return result;
  } catch (err: any) {
    console.warn('[FOURSQUARE] Photo lookup failed:', err?.response?.status, err?.message);
    // Cache failures too (with shorter TTL) to avoid hammering the API
    if (err?.response?.status === 429) {
      console.warn('[FOURSQUARE] Rate limit hit - backing off');
    }
    return null;
  }
}

// Country boundary definitions
const COUNTRY_BOUNDARIES: Record<string, { regions: { lat: number[]; lng: number[] }[] }> = {
  ES: { // Spain
    regions: [
      { lat: [35.0, 44.0], lng: [-10.0, 4.5] }, // Mainland + Balearics
      { lat: [27.0, 29.5], lng: [-18.5, -13.0] } // Canary Islands
    ]
  },
  FR: { // France
    regions: [{ lat: [41.0, 51.5], lng: [-5.5, 10.0] }]
  },
  IT: { // Italy
    regions: [{ lat: [35.0, 47.5], lng: [6.0, 19.0] }]
  },
  US: { // United States
    regions: [
      { lat: [24.396308, 49.384358], lng: [-125.0, -66.93457] }, // Continental US
      { lat: [18.91619, 28.402123], lng: [-178.334698, -154.806773] }, // Hawaii
      { lat: [51.209, 71.365], lng: [-179.148909, -129.979506] } // Alaska
    ]
  },
  GB: { // United Kingdom
    regions: [{ lat: [49.959999905, 60.845138], lng: [-7.57216793459, 1.68153079591] }]
  },
  DE: { // Germany
    regions: [{ lat: [47.0, 55.5], lng: [5.5, 15.5] }]
  },
  TR: { // Turkey
    regions: [{ lat: [35.5, 42.5], lng: [25.5, 45.0] }]
  },
  MX: { // Mexico
    regions: [{ lat: [14.5, 33.0], lng: [-118.0, -86.0] }]
  },
  GR: { // Greece
    regions: [{ lat: [34.5, 42.0], lng: [19.0, 30.0] }]
  },
  CN: { // China
    regions: [{ lat: [18.0, 54.0], lng: [73.0, 135.0] }]
  }
};

// Universal destination curator validation
function isDestinationQualified(
  place: any, 
  countryCode: string, 
  isLuxury: boolean = false, 
  rating?: number, 
  reviewCount?: number
): { qualified: boolean; reason?: string } {
  const lat = place.geometry?.location?.lat;
  const lng = place.geometry?.location?.lng;
  
  // Geographic validation
  if (lat !== undefined && lng !== undefined && COUNTRY_BOUNDARIES[countryCode]) {
    const boundaries = COUNTRY_BOUNDARIES[countryCode].regions;
    const isInCountry = boundaries.some((region: { lat: number[]; lng: number[] }) => 
      lat >= region.lat[0] && lat <= region.lat[1] && 
      lng >= region.lng[0] && lng <= region.lng[1]
    );
    
    if (!isInCountry) {
      return { qualified: false, reason: `Location not in ${countryCode}` };
    }
  }
  
  // Luxury quality checks (if luxury mode activated)
  if (isLuxury) {
    if (rating !== undefined && rating < 4.5) {
      return { qualified: false, reason: 'Rating below luxury threshold (4.5)' };
    }
    
    const minReviews = ['ES', 'FR', 'IT', 'US', 'GB'].includes(countryCode) ? 200 : 150;
    if (reviewCount !== undefined && reviewCount < minReviews) {
      return { qualified: false, reason: 'Insufficient reviews for luxury verification' };
    }
  }
  
  return { qualified: true };
}

router.get('/', async (req, res) => {
  const {
    query,
    place_id,
    luxury_spain,
    curator_mode,
    country_code,
    is_luxury,
    language,
    country,
    city,
    country_name,
  } = req.query as {
    query?: string;
    place_id?: string;
    luxury_spain?: string;
    curator_mode?: string;
    country_code?: string;
    is_luxury?: string;
    language?: string;
    country?: string;
    city?: string;
    country_name?: string;
  };

  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  let effectiveQuery = '';
  try {
    // Use query primarily; if only place_id is provided, treat it as a query fallback
    effectiveQuery = (query || place_id || '').toString().trim();
    if (!effectiveQuery) {
      return res.status(400).json({ error: 'query required (Mapbox mode)' });
    }

    if (!MAPBOX_TOKEN) {
      console.warn('[PLACES] MAPBOX_ACCESS_TOKEN missing – falling back to Nominatim');
      const fallback = await buildFallbackPlace(effectiveQuery);
      if (fallback) {
        return res.json({ ...fallback, fallback_reason: 'mapbox_token_missing' });
      }
      return res.status(500).json({ error: 'MAPBOX_ACCESS_TOKEN missing' });
    }

    // Hard override for known landmarks to use their correct geographic name
    const ql = effectiveQuery.toLowerCase();
    console.log('[PLACES] Original query:', effectiveQuery);
    if (ql.includes('eiffel') || (ql.includes('paris') && ql.includes('tower'))) {
      effectiveQuery = 'Tour Eiffel, Paris, France';
      console.log('[PLACES] Override applied, new query:', effectiveQuery);
    } else if (ql.includes('paris') && !ql.includes('texas') && !ql.includes('tennessee')) {
      effectiveQuery = effectiveQuery + ', France';
      console.log('[PLACES] Paris suffix applied, new query:', effectiveQuery);
    }

    const cityHint = (city || '').toString().trim();
    if (cityHint && !ql.includes(cityHint.toLowerCase())) {
      effectiveQuery = `${effectiveQuery}, ${cityHint}`;
    }

    const countryNameHint = (country_name || '').toString().trim();
    if (countryNameHint && !ql.includes(countryNameHint.toLowerCase())) {
      effectiveQuery = `${effectiveQuery}, ${countryNameHint}`;
    }

    // Geocode with Mapbox
    const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      effectiveQuery
    )}.json`;
    console.log('[PLACES] Geocoding URL:', geoUrl);
    // Determine target country from keyword map or explicit ?country=
    const KEYWORD_COUNTRY_MAP: Record<string, string> = {
      paris: 'fr',
      eiffel: 'fr',
      rome: 'it',
      madrid: 'es',
      barcelona: 'es',
      london: 'gb',
      berlin: 'de',
      athens: 'gr',
      venice: 'it',
      florence: 'it',
      milan: 'it',
      lisbon: 'pt',
      kyoto: 'jp',
      tokyo: 'jp',
      osaka: 'jp',
      santorini: 'gr',
      mykonos: 'gr',
    };
    const keywordCountry = Object.keys(KEYWORD_COUNTRY_MAP).find(k => ql.includes(k));
    const initialCountry = (country || (keywordCountry ? KEYWORD_COUNTRY_MAP[keywordCountry] : undefined)) as string | undefined;

    // Optional bbox when a target country is known
    let bboxParam: any = {};
    try {
      if (initialCountry) {
        const cc = (initialCountry || '').toUpperCase();
        const bounds = COUNTRY_BOUNDARIES[cc as keyof typeof COUNTRY_BOUNDARIES]?.regions?.[0];
        if (bounds) {
          const minLon = bounds.lng[0];
          const minLat = bounds.lat[0];
          const maxLon = bounds.lng[1];
          const maxLat = bounds.lat[1];
          bboxParam = { bbox: `${minLon},${minLat},${maxLon},${maxLat}` };
        }
      }
    } catch {}

    const geoResp = await axios.get(geoUrl, {
      params: {
        access_token: MAPBOX_TOKEN,
        // fetch a few to allow post-filtering (e.g., avoid US when query implies international)
        limit: 5,
        types: 'poi,address,place',
        language: language || 'en',
        ...(initialCountry ? { country: initialCountry } : {}),
        ...bboxParam,
        ...((ql.includes('paris') || ql.includes('eiffel')) ? { proximity: '2.3522,48.8566' } : {}),
      },
    });

    const features: any[] = Array.isArray(geoResp.data?.features) ? geoResp.data.features : [];
    console.log('[PLACES] Mapbox returned', features.length, 'features. First:', features[0]?.place_name);
    if (!features.length) {
      const fallback = await buildFallbackPlace(effectiveQuery);
      if (fallback) {
        return res.json({ ...fallback, fallback_reason: 'mapbox_no_results' });
      }
      return res.status(404).json({ error: 'Place not found' });
    }

    const getCountryCode = (f: any): string | undefined =>
      (f?.properties?.country_code || f?.context?.find?.((c: any) => typeof c?.id === 'string' && c.id.startsWith('country'))?.short_code || '').toLowerCase() || undefined;

    // Simple heuristics: if query mentions globally known international places,
    // prefer non-US results; special-case common cities to target their country.
    const preferNonUS = /(paris|eiffel|rome|madrid|barcelona|berlin|athens|venice|florence|milan|lisbon|london|kyoto|tokyo|osaka|santorini|mykonos)/.test(ql);

    // Choose best feature
    let feature: any = features[0];
    // Paris → prefer France
    if (ql.includes('paris') || ql.includes('eiffel')) {
      const frBest = features.find(f => getCountryCode(f) === 'fr' && /paris|eiffel|tour eiffel/i.test((f.place_name || f.text || '')));
      if (frBest) {
        feature = frBest;
      } else {
        const frAny = features.find(f => getCountryCode(f) === 'fr');
        if (frAny) feature = frAny;
      }
    } else if (preferNonUS) {
      const nonUS = features.find(f => getCountryCode(f) && getCountryCode(f) !== 'us');
      if (nonUS) feature = nonUS;
    }

    // Fallback: if we still landed in the US but query implies international,
    // retry a targeted country lookup (e.g., "Eiffel" → FR).
    if ((initialCountry || preferNonUS) && getCountryCode(feature) === 'us') {
      let targetCountry: string | undefined;
      targetCountry = initialCountry || undefined;
      if (!targetCountry) {
        for (const [kw, cc] of Object.entries(KEYWORD_COUNTRY_MAP)) {
          if (ql.includes(kw)) { targetCountry = cc; break; }
        }
      }
      if (targetCountry) {
        try {
          let retryBbox: any = {};
          const cc = (targetCountry || '').toUpperCase();
          const bounds = COUNTRY_BOUNDARIES[cc as keyof typeof COUNTRY_BOUNDARIES]?.regions?.[0];
          if (bounds) {
            retryBbox = { bbox: `${bounds.lng[0]},${bounds.lat[0]},${bounds.lng[1]},${bounds.lat[1]}` };
          }
          const retry = await axios.get(geoUrl, {
            params: {
              access_token: MAPBOX_TOKEN,
              limit: 1,
              types: 'poi,address,place',
              language: language || 'en',
              country: targetCountry,
              ...retryBbox,
              ...((ql.includes('paris') || ql.includes('eiffel')) ? { proximity: '2.3522,48.8566' } : {}),
            },
          });
          const alt = retry.data?.features?.[0];
          if (alt) {
            feature = alt;
          }
        } catch (e) {
          // ignore and keep previous best
        }

        // Final explicit fallback if still US: query with country name appended
        if (getCountryCode(feature) === 'us') {
          const COUNTRY_NAME: Record<string, string> = {
            fr: 'France', it: 'Italy', es: 'Spain', gb: 'United Kingdom', de: 'Germany',
            gr: 'Greece', pt: 'Portugal', jp: 'Japan'
          };
          const countryName = COUNTRY_NAME[(targetCountry || '').toLowerCase()];
          if (countryName) {
            try {
              const explicitCore = /eiffel/.test(ql) ? 'Tour Eiffel Paris' : effectiveQuery;
              const explicitQuery = `${explicitCore} ${countryName}`.trim();
              const explicitUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(explicitQuery)}.json`;
              // Compute bbox again for safety
              let retryBbox2: any = {};
              const cc2 = (targetCountry || '').toUpperCase();
              const bounds2 = COUNTRY_BOUNDARIES[cc2 as keyof typeof COUNTRY_BOUNDARIES]?.regions?.[0];
              if (bounds2) {
                retryBbox2 = { bbox: `${bounds2.lng[0]},${bounds2.lat[0]},${bounds2.lng[1]},${bounds2.lat[1]}` };
              }
              const explicit = await axios.get(explicitUrl, {
                params: {
                  access_token: MAPBOX_TOKEN,
                  limit: 1,
                  types: 'poi,address,place',
                  language: language || 'en',
                  country: targetCountry,
                  ...retryBbox2,
                  ...((ql.includes('paris') || ql.includes('eiffel')) ? { proximity: '2.3522,48.8566' } : {}),
                },
              });
              const alt2 = explicit.data?.features?.[0];
              if (alt2) {
                feature = alt2;
              }
            } catch {}
          }
        }
      }
    }


    // Build simple description from Mapbox properties
    const category = feature.properties?.category || feature.place_type?.[0] || '';
    const placeName = feature.text || feature.place_name || effectiveQuery;
    const description = feature.place_name;

    // Mapbox does not provide reviews; return empty array
    let reviews: Review[] = [];
    let rating: number | undefined = undefined;

    // Google Places enrichment removed – fully Mapbox-based with photo fallbacks

    // Booking URL unknown; leave undefined
    const bookingUrl: string | undefined = undefined;

    // Prefer Foursquare imagery when available, fallback to Mapbox static map or Unsplash
    const [centerLng, centerLat] = getFeatureCenter(feature);
    let foursquarePhoto: FoursquarePhotoResult | null = null;
    if (typeof centerLat === 'number' && typeof centerLng === 'number') {
      foursquarePhoto = await fetchFoursquarePhoto(placeName, centerLat, centerLng);
    }

    const buildStaticMapImage = (w: number, h: number) => {
      if (typeof centerLng !== 'number' || typeof centerLat !== 'number') return null;
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+6B5B95(${centerLng},${centerLat})/${centerLng},${centerLat},14,0/${w}x${h}?access_token=${MAPBOX_TOKEN}`;
    };

    // Prioritize real photos over map tiles
    let photoUrl: string | null = null;
    let thumbUrl: string | null = null;
    let photoSource: string | undefined = undefined;

    if (foursquarePhoto) {
      // Best option: real venue photos from Foursquare
      photoUrl = foursquarePhoto.photoUrl;
      thumbUrl = foursquarePhoto.thumbUrl;
      photoSource = foursquarePhoto.source;
      console.log('[PLACES] Using Foursquare photo for:', placeName);
    } else {
      // Try Pexels for high-quality stock photos
      const pexelsPhoto = await fetchPexelsPhoto(placeName);
      if (pexelsPhoto) {
        photoUrl = pexelsPhoto.url;
        thumbUrl = pexelsPhoto.thumb;
        photoSource = 'Pexels';
        console.log('[PLACES] Using Pexels photo for:', placeName);
      } else {
        // Final fallback: Unsplash
        const fallbackSeed = encodeURIComponent(placeName || category || 'travel destination');
        photoUrl = `https://source.unsplash.com/800x600/?${fallbackSeed}`;
        thumbUrl = `https://source.unsplash.com/400x300/?${fallbackSeed}`;
        photoSource = 'Unsplash';
        console.log('[PLACES] Using Unsplash fallback for:', placeName);
      }
    }

    // Curator validation pass-through (we cannot geo-validate without country bounds data of the feature; skipping advanced checks)

    // Universal destination curator validation
    const isDestinationMode = curator_mode === 'true' || luxury_spain === 'true';
    const targetCountryCode = country_code || (luxury_spain === 'true' ? 'ES' : undefined);
    const luxuryMode = is_luxury === 'true' || luxury_spain === 'true';
    
    if (isDestinationMode && targetCountryCode) {
      // Best-effort geo validation using feature center coords
      const [lng, lat] = getFeatureCenter(feature);
      const reviewCount = reviews?.length || 0;
      const destinationCheck = isDestinationQualified(
        { geometry: { location: { lat, lng } } },
        targetCountryCode,
        luxuryMode,
        rating,
        reviewCount
      );

      if (!destinationCheck.qualified) {
        console.log(
          `[PLACES] ${targetCountryCode} curator validation failed:`,
          destinationCheck.reason
        );
        return res.status(404).json({
          error: `Does not meet ${targetCountryCode} ${luxuryMode ? 'luxury ' : ''}standards`,
          reason: destinationCheck.reason,
        });
      }

      console.log(`[PLACES] ✅ ${targetCountryCode} curator validation passed`);
    }

    // Add curator validation fields to response
    const responseData: any = {
      place_id: feature.id,
      rating,
      photoReference: undefined,
      photoUrl,
      thumbUrl,
      description,
      reviews,
      bookingUrl,
      lat: centerLat,
      lng: centerLng,
    };

    if (foursquarePhoto?.attribution) {
      responseData.photo_attribution = foursquarePhoto.attribution;
    }
    if (foursquarePhoto?.fsq_id) {
      responseData.foursquare_place_id = foursquarePhoto.fsq_id;
    }
    if (photoSource) {
      responseData.photo_source = photoSource;
    }

    // Add curator metadata if in curator mode
    if (isDestinationMode && targetCountryCode) {
      const countryNames: Record<string, string> = {
        ES: 'Spain', FR: 'France', IT: 'Italy', US: 'United States',
        GB: 'United Kingdom', DE: 'Germany', TR: 'Turkey', 
        MX: 'Mexico', GR: 'Greece', CN: 'China'
      };
      
      responseData.luxury_reason = `Verified ${luxuryMode ? 'luxury ' : ''}establishment in ${countryNames[targetCountryCode]}`;
      responseData.sources = ['Mapbox Geocoding', 'Destination curator verified'];
      responseData.review_count = reviews?.length || 0;
      responseData.price_tier = rating && rating >= 4.7 ? 5 : (rating && rating >= 4.3 ? 4 : 3);
      responseData.image_quality = photoUrl ? 'high' : 'medium';
      responseData.geo_validated = true;
      responseData.country_code = targetCountryCode;
      responseData.curator_mode = curator_mode;
    }

    return res.json(responseData);
  } catch (err: any) {
    console.error('[PLACES] error', err?.message);
    const fallback = await buildFallbackPlace(
      effectiveQuery || (query?.toString?.() ?? '') || (place_id?.toString?.() ?? '')
    );
    if (fallback) {
      return res.json({
        ...fallback,
        fallback_reason: 'mapbox_error',
        upstream_error: err?.message,
      });
    }
    res.status(500).json({ error: 'Places fetch failed' });
  }
});

export default router; 