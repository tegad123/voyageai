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

router.get('/', async (req, res) => {
  const { query, place_id } = req.query as { query?: string; place_id?: string };
  const GOOGLE_KEY = process.env.GOOGLE_PLACES_KEY;
  if (!GOOGLE_KEY) return res.status(500).json({ error: 'GOOGLE_PLACES_KEY missing' });

  try {
    let pid = place_id as string | undefined;
    let rating: number | undefined;
    let photoRef: string | undefined;
    let description: string | undefined;
    let reviews: Review[] | undefined;
    let bookingUrl: string | undefined;
    let lat: number | undefined;
    let lng: number | undefined;

    if (!pid) {
      if (!query) return res.status(400).json({ error: 'query or place_id required' });
      // Text search
      const tsResp = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: { query, key: GOOGLE_KEY },
      });
      const first: TextSearchResult | undefined = tsResp.data.results?.[0];
      if (!first) return res.status(404).json({ error: 'Place not found' });
      pid = first.place_id;
      rating = first.rating;
      photoRef = first.photos?.[0]?.photo_reference;
    }

    if (pid && (rating === undefined || !photoRef || !description || !reviews || lat === undefined || lng === undefined)) {
      const fields = 'rating,photo,editorial_summary,reviews,url,website,geometry';
      const detResp = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
        params: { place_id: pid, fields, key: GOOGLE_KEY },
      });
      const det = detResp.data.result;
      rating = rating ?? det.rating;
      photoRef = photoRef ?? det.photos?.[0]?.photo_reference;
      description = det.editorial_summary?.overview;
      if (det.reviews) {
        reviews = (det.reviews as Review[]).slice(0,5).map(r => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          relative_time_description: r.relative_time_description,
        }));
      }
      const website = det.website as string | undefined;
      const googleUrl = det.url as string | undefined;
      bookingUrl = website || googleUrl;
      lat = det.geometry?.location?.lat;
      lng = det.geometry?.location?.lng;
    }

    const buildPhotoUrl = (ref: string | undefined, max: number) =>
      ref ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${max}&photo_reference=${ref}&key=${GOOGLE_KEY}` : undefined;

    const photoUrl   = buildPhotoUrl(photoRef, 800);
    const thumbUrl   = buildPhotoUrl(photoRef, 400);

    return res.json({
      place_id: pid,
      rating,
      photoReference: photoRef,
      photoUrl,
      thumbUrl,
      description,
      reviews,
      bookingUrl,
      lat,
      lng,
    });
  } catch (err: any) {
    console.error('[PLACES] error', err?.message);
    res.status(500).json({ error: 'Google Places fetch failed' });
  }
});

export default router; 