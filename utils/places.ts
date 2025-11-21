// Client-side places API utility using MapBox + photo fallback
import axios from '../api/axios';

// Use MapBox + photo fallback instead of Google Places
// The /places endpoint now points to MapBox (was Google Places)
const PLACES_ENDPOINT = '/places';

type PlaceQueryOptions = {
  city?: string;
  country?: string;
  countryCode?: string;
};

export const fetchPlaceData = async (query: string, options?: PlaceQueryOptions) => {
  console.log(`[PLACES] Using MapBox + photo fallback for:`, query, options);
  
  try {
    const params: Record<string, string> = { query };
    if (options?.countryCode && options.countryCode.length === 2) {
      params.country = options.countryCode.toLowerCase();
    } else if (options?.country && options.country.length <= 2) {
      params.country = options.country.toLowerCase();
    }
    if (options?.city) {
      params.city = options.city;
    }
    if (options?.country && options.country.length > 2) {
      params.country_name = options.country;
    }

    const response = await axios.get(PLACES_ENDPOINT, { 
      params 
    });
    console.log(`[PLACES] Got response:`, response.data.name || response.data.description, response.data.photoUrl ? 'with photo' : 'no photo');
    return response.data;
  } catch (error) {
    console.error(`[PLACES] Error fetching from MapBox:`, error);
    throw error;
  }
};

export const fetchPlaceById = async (place_id: string) => {
  console.log(`[PLACES] Fetching place by ID via MapBox:`, place_id);
  
  try {
    const response = await axios.get(PLACES_ENDPOINT, { 
      params: { place_id } 
    });
    return response.data;
  } catch (error) {
    console.error(`[PLACES] Error fetching place by ID:`, error);
    throw error;
  }
};
