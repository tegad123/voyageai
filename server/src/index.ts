import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { resolve } from 'path';
import chatRouter from './routes/chat';
import chatStreamRouter from './routes/chatStream';
import itineraryRouter from './routes/itinerary';
import placesRouter from './routes/places';
// Removed places-free router
import placesMapboxRouter from './routes/places-mapbox';
import usageRouter from './routes/usage';
import { ApiError } from './types';
import { validateApiKey } from './middleware/auth';
import { Request, Response, NextFunction } from 'express';

// Load environment variables from server/.env explicitly (works regardless of cwd)
config({ path: resolve(__dirname, '../.env') });

// Validate required environment variables
if (!process.env.API_KEY) {
  console.error('[ENV] API_KEY is not set in environment variables');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('[ENV] OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Google Places API replaced with MapBox
if (!process.env.MAPBOX_ACCESS_TOKEN) {
  console.warn('[ENV] MAPBOX_ACCESS_TOKEN not set – place details will be unavailable');
}

console.log('[ENV] Environment variables loaded successfully');
console.log('[ENV] API_KEY starts with:', process.env.API_KEY.substring(0, 4) + '...');
console.log('🔑 OpenAI key (from env):', process.env.OPENAI_API_KEY);
console.log('[DEBUG] MAPBOX_ACCESS_TOKEN env =', process.env.MAPBOX_ACCESS_TOKEN?.substring(0, 10) || 'undefined');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Health check - no auth required
app.get('/ping', (req, res) => {
  console.log('🛎️  Received ping');
  return res.json({ ok: true });
});

// CORS configuration - allow requests from ngrok domains
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:8083',
    'http://localhost:3000',
    'http://localhost:3001',
    /^https:\/\/.*\.ngrok-free\.app$/,
    /^https:\/\/.*\.ngrok\.io$/,
    /^https:\/\/.*\.ngrok\.app$/,
    /^https:\/\/.*\.ngrok\.dev$/,
    'https://voyageai-backend.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log every incoming request
app.use((req, res, next) => {
  console.log(`📥 [INCOMING] ${req.method} ${req.url}`);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Timeout middleware – allow OpenAI more time (90 s)
app.use((req, res, next) => {
  const TIMEOUT_MS = 90000; // 90 seconds – accommodates longer GPT-4 responses
  res.setTimeout(TIMEOUT_MS, () => {
    console.log(`[TIMEOUT] ${req.method} ${req.url}`);
    res.status(504).json({ error: 'Request timeout' });
  });
  next();
});

// Chat routes with auth middleware
app.use('/chat/stream', require('./middleware/auth').validateApiKey, chatStreamRouter);
app.use('/chat', require('./middleware/auth').validateApiKey, chatRouter);

// Other routes with auth middleware
app.use('/itinerary', require('./middleware/auth').validateApiKey, itineraryRouter);
// Old Google Places API route - DISABLED
// app.use('/places', require('./middleware/auth').validateApiKey, placesRouter);

// New MapBox + Photo Fallback API (replaces Google Places)
// Public access for image/place lookups to ensure client can load thumbnails without auth friction
app.use('/places', placesMapboxRouter);
app.use('/places-mapbox', placesMapboxRouter);

// Usage/rate limit routes with auth middleware
app.use('/usage', require('./middleware/auth').validateApiKey, usageRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Listening on port ${PORT}`);
  console.log(`[SERVER] Local: http://localhost:${PORT}`);
  console.log(`[SERVER] Network: http://0.0.0.0:${PORT}`);
}); 