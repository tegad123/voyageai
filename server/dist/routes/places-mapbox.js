"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
// Geographic boundaries for major travel destinations (copied from original places.ts)
const COUNTRY_BOUNDARIES = {
    ES: {
        regions: [{ lat: [36.0, 43.8], lng: [-9.3, 3.3] }]
    },
    FR: {
        regions: [{ lat: [41.3, 51.1], lng: [-5.1, 9.6] }]
    },
    IT: {
        regions: [{ lat: [35.5, 47.1], lng: [6.6, 18.5] }]
    },
    GR: {
        regions: [{ lat: [34.8, 41.7], lng: [19.4, 29.6] }]
    },
    GB: {
        regions: [{ lat: [49.9, 60.8], lng: [-8.2, 1.8] }]
    },
    DE: {
        regions: [{ lat: [47.3, 55.1], lng: [5.9, 15.0] }]
    },
    JP: {
        regions: [{ lat: [24.0, 46.0], lng: [123.0, 146.0] }]
    },
    CN: {
        regions: [{ lat: [18.0, 54.0], lng: [73.0, 135.0] }]
    }
};
// Function to detect if a location should prioritize international over US
function shouldPrioritizeInternational(query) {
    const internationalKeywords = [
        // European countries/cities
        'paris', 'london', 'rome', 'madrid', 'barcelona', 'berlin', 'amsterdam', 'vienna', 'prague', 'budapest',
        'athens', 'santorini', 'mykonos', 'venice', 'florence', 'milan', 'zurich', 'geneva', 'stockholm', 'oslo',
        'copenhagen', 'helsinki', 'dublin', 'edinburgh', 'lisbon', 'porto', 'brussels', 'luxembourg',
        // Asian countries/cities  
        'tokyo', 'kyoto', 'osaka', 'shibuya', 'harajuku', 'beijing', 'shanghai', 'hong kong', 'singapore',
        'bangkok', 'phuket', 'bali', 'jakarta', 'kuala lumpur', 'manila', 'seoul', 'busan', 'taipei',
        'mumbai', 'delhi', 'bangalore', 'kolkata', 'chennai', 'goa', 'kerala', 'rajasthan',
        // Middle East/Africa
        'dubai', 'abu dhabi', 'doha', 'riyadh', 'kuwait', 'cairo', 'alexandria', 'marrakech', 'casablanca',
        'cape town', 'johannesburg', 'nairobi', 'lagos', 'accra', 'tunis', 'algiers',
        // South America
        'buenos aires', 'rio de janeiro', 'sao paulo', 'lima', 'cusco', 'machu picchu', 'santiago', 'bogota',
        'caracas', 'quito', 'montevideo', 'asuncion', 'la paz', 'sucre',
        // Oceania
        'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'auckland', 'wellington', 'christchurch',
        // Famous landmarks
        'eiffel tower', 'colosseum', 'big ben', 'sagrada familia', 'acropolis', 'taj mahal', 'great wall',
        'angkor wat', 'petra', 'machu picchu', 'christ redeemer', 'burj khalifa', 'burj al arab',
        'blue mosque', 'hagia sophia', 'kremlin', 'red square', 'louvre', 'vatican', 'sistine chapel',
        'buckingham palace', 'tower bridge', 'neuschwanstein', 'mont blanc', 'matterhorn', 'fuji',
        // Country names
        'france', 'italy', 'spain', 'germany', 'greece', 'turkey', 'japan', 'china', 'india', 'thailand',
        'indonesia', 'malaysia', 'singapore', 'south korea', 'vietnam', 'cambodia', 'laos', 'myanmar',
        'egypt', 'morocco', 'south africa', 'kenya', 'tanzania', 'brazil', 'argentina', 'chile', 'peru',
        'colombia', 'ecuador', 'australia', 'new zealand', 'fiji', 'maldives', 'seychelles', 'mauritius'
    ];
    const queryLower = query.toLowerCase();
    return internationalKeywords.some(keyword => queryLower.includes(keyword));
}
// MapBox + Free Photo Fallback API to replace Google Places
router.get('/', async (req, res) => {
    const { query, place_id } = req.query;
    if (!query && !place_id) {
        return res.status(400).json({ error: 'query required' });
    }
    const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
    if (!MAPBOX_TOKEN) {
        return res.status(500).json({ error: 'MAPBOX_ACCESS_TOKEN missing' });
    }
    try {
        let place = {};
        // 1. Use MapBox Geocoding API for place search with international prioritization
        if (query) {
            console.log('[MAPBOX_PLACES] Searching for:', query);
            const prioritizeInternational = shouldPrioritizeInternational(query);
            console.log('[MAPBOX_PLACES] Prioritize international:', prioritizeInternational);
            const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
            const searchParams = {
                access_token: MAPBOX_TOKEN,
                types: 'poi,address,place',
                limit: prioritizeInternational ? 5 : 1 // Get more results if international to filter
            };
            // If prioritizing international, exclude US results
            if (prioritizeInternational) {
                searchParams.exclude_countries = 'us';
            }
            const mapboxResponse = await axios_1.default.get(mapboxUrl, {
                params: searchParams
            });
            let mapboxPlace = mapboxResponse.data.features[0];
            // If prioritizing international but got US result, try without US
            if (prioritizeInternational && mapboxPlace?.properties?.country_code === 'us') {
                console.log('[MAPBOX_PLACES] Got US result, filtering for international...');
                const nonUSResults = mapboxResponse.data.features.filter((f) => f.properties?.country_code !== 'us' && f.properties?.country_code !== 'US');
                if (nonUSResults.length > 0) {
                    mapboxPlace = nonUSResults[0];
                    console.log('[MAPBOX_PLACES] Using international result:', mapboxPlace.place_name);
                }
            }
            if (!mapboxPlace) {
                return res.status(404).json({ error: 'Place not found' });
            }
            // Extract place data from MapBox response
            place = {
                place_id: mapboxPlace.id,
                name: mapboxPlace.text || mapboxPlace.place_name,
                address: mapboxPlace.place_name,
                lat: mapboxPlace.center[1], // MapBox returns [lng, lat]
                lng: mapboxPlace.center[0],
                type: mapboxPlace.properties?.category || 'place',
                // Generate a reasonable rating (MapBox doesn't provide ratings)
                rating: 4.0 + (Math.random() * 0.8), // Random between 4.0-4.8
            };
            console.log('[MAPBOX_PLACES] Found place:', place.name);
        }
        // 2. Try to get photo from free APIs (fallback chain)
        let photoUrl;
        let thumbUrl;
        let photoAttribution;
        let photoAttributionUrl;
        const searchTerm = query?.split(',')[0]?.trim() || query; // Use first part for photo search
        // Try Unsplash first
        try {
            const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
            if (unsplashKey && searchTerm) {
                console.log('[MAPBOX_PLACES] Trying Unsplash for:', searchTerm);
                const unsplashResponse = await axios_1.default.get('https://api.unsplash.com/search/photos', {
                    params: {
                        query: searchTerm,
                        per_page: 1,
                        orientation: 'landscape'
                    },
                    headers: {
                        'Authorization': `Client-ID ${unsplashKey}`
                    }
                });
                const photo = unsplashResponse.data.results[0];
                if (photo) {
                    photoUrl = photo.urls.regular;
                    thumbUrl = photo.urls.small;
                    photoAttribution = `Photo by ${photo.user.name} on Unsplash`;
                    photoAttributionUrl = photo.links.html;
                    console.log('[MAPBOX_PLACES] Got Unsplash photo');
                }
            }
        }
        catch (unsplashError) {
            console.warn('[MAPBOX_PLACES] Unsplash failed:', unsplashError);
        }
        // Try Pexels as fallback
        if (!photoUrl) {
            try {
                const pexelsKey = process.env.PEXELS_API_KEY;
                if (pexelsKey && searchTerm) {
                    console.log('[MAPBOX_PLACES] Trying Pexels for:', searchTerm);
                    const pexelsResponse = await axios_1.default.get('https://api.pexels.com/v1/search', {
                        params: {
                            query: searchTerm,
                            per_page: 1,
                            orientation: 'landscape'
                        },
                        headers: {
                            'Authorization': pexelsKey
                        }
                    });
                    const photo = pexelsResponse.data.photos[0];
                    if (photo) {
                        photoUrl = photo.src.large;
                        thumbUrl = photo.src.medium;
                        photoAttribution = `Photo by ${photo.photographer} on Pexels`;
                        photoAttributionUrl = photo.url;
                        console.log('[MAPBOX_PLACES] Got Pexels photo');
                    }
                }
            }
            catch (pexelsError) {
                console.warn('[MAPBOX_PLACES] Pexels failed:', pexelsError);
            }
        }
        // Final fallback to placeholder
        if (!photoUrl) {
            const fallbackSeed = encodeURIComponent(searchTerm || 'travel');
            photoUrl = `https://picsum.photos/seed/${fallbackSeed}/800/600`;
            thumbUrl = `https://picsum.photos/seed/${fallbackSeed}/400/300`;
            console.log('[MAPBOX_PLACES] Using placeholder photo');
        }
        // 3. Add photo data to place
        place.photoUrl = photoUrl;
        place.thumbUrl = thumbUrl;
        if (photoAttribution) {
            place.photoAttribution = photoAttribution;
            place.photoAttributionUrl = photoAttributionUrl;
        }
        // 4. Generate basic description (you could enhance this with AI later)
        place.description = `Discover ${place.name || query} - a wonderful destination to explore.`;
        // 5. Mock some reviews (you could integrate with TripAdvisor API later if needed)
        place.reviews = [
            {
                author_name: "Travel Enthusiast",
                rating: Math.floor(place.rating),
                text: "Great place to visit! Highly recommended.",
                relative_time_description: "2 months ago"
            }
        ];
        // 6. Generate booking URL (could be enhanced with real booking integration)
        place.bookingUrl = `https://www.google.com/search?q=${encodeURIComponent(place.name || query)}`;
        console.log('[MAPBOX_PLACES] Returning place data for:', place.name);
        res.json(place);
    }
    catch (error) {
        console.error('[MAPBOX_PLACES] Error:', error.message);
        res.status(500).json({ error: 'Failed to fetch place data' });
    }
});
exports.default = router;
