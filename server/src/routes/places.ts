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
  } = req.query as {
    query?: string;
    place_id?: string;
    luxury_spain?: string;
    curator_mode?: string;
    country_code?: string;
    is_luxury?: string;
    language?: string;
    country?: string;
  };

  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  if (!MAPBOX_TOKEN) {
    return res.status(500).json({ error: 'MAPBOX_ACCESS_TOKEN missing' });
  }

  try {
    // Use query primarily; if only place_id is provided, treat it as a query fallback
    let effectiveQuery = (query || place_id || '').toString().trim();
    if (!effectiveQuery) {
      return res.status(400).json({ error: 'query required (Mapbox mode)' });
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

    // Photo strategy: use Unsplash Source with query to get a relevant image
    const size = (w: number, h: number) => `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(placeName + ' ' + category)}`;
    const photoUrl = size(800, 600);
    const thumbUrl = size(400, 300);

    // Curator validation pass-through (we cannot geo-validate without country bounds data of the feature; skipping advanced checks)

    // Universal destination curator validation
    const isDestinationMode = curator_mode === 'true' || luxury_spain === 'true';
    const targetCountryCode = country_code || (luxury_spain === 'true' ? 'ES' : undefined);
    const luxuryMode = is_luxury === 'true' || luxury_spain === 'true';
    
    if (isDestinationMode && targetCountryCode) {
      // Best-effort geo validation using feature center coords
      const center = feature.center || [];
      const lat = center[1];
      const lng = center[0];
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
    };

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
    res.status(500).json({ error: 'Places fetch failed' });
  }
});

export default router; 