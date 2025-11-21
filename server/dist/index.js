"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
const path_1 = require("path");
const chat_1 = __importDefault(require("./routes/chat"));
const chatStream_1 = __importDefault(require("./routes/chatStream"));
const itinerary_1 = __importDefault(require("./routes/itinerary"));
const places_1 = __importDefault(require("./routes/places"));
const usage_1 = __importDefault(require("./routes/usage"));
// Load environment variables from server/.env explicitly (works regardless of cwd)
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, '../.env') });
// Validate required environment variables
if (!process.env.API_KEY) {
    console.error('[ENV] API_KEY is not set in environment variables');
    process.exit(1);
}
if (!process.env.OPENAI_API_KEY) {
    console.error('[ENV] OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
}
if (!process.env.MAPBOX_ACCESS_TOKEN) {
    console.warn('[ENV] ⚠️  MAPBOX_ACCESS_TOKEN not set – geocoding will be unavailable');
}
if (!process.env.GOOGLE_PLACES_KEY) {
    console.warn('[ENV] ⚠️  GOOGLE_PLACES_KEY not set – will fall back to Foursquare/Pexels');
}
else {
    console.log('[ENV] ✅ GOOGLE_PLACES_KEY is set (primary photo/review source)');
}
if (!process.env.FOURSQUARE_API_KEY) {
    console.warn('[ENV] ⚠️  FOURSQUARE_API_KEY not set – will skip Foursquare fallback');
}
else {
    console.log('[ENV] ✅ FOURSQUARE_API_KEY is set (fallback source)');
}
if (!process.env.PEXELS_API_KEY) {
    console.warn('[ENV] ⚠️  PEXELS_API_KEY not set – will use Unsplash as final fallback');
}
else {
    console.log('[ENV] ✅ PEXELS_API_KEY is set (stock photo fallback)');
}
console.log('[ENV] Environment variables loaded successfully');
console.log('[ENV] API_KEY starts with:', process.env.API_KEY.substring(0, 4) + '...');
console.log('🔑 OpenAI key (from env):', process.env.OPENAI_API_KEY);
console.log('[DEBUG] MAPBOX_ACCESS_TOKEN env =', process.env.MAPBOX_ACCESS_TOKEN?.substring(0, 10) || 'undefined');
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3001;
// Health check - no auth required
app.get('/ping', (req, res) => {
    console.log('🛎️  Received ping');
    return res.json({ ok: true });
});
// CORS configuration - allow requests from ngrok domains
app.use((0, cors_1.default)({
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use('/chat/stream', require('./middleware/auth').validateApiKey, chatStream_1.default);
app.use('/chat', require('./middleware/auth').validateApiKey, chat_1.default);
// Other routes with auth middleware
app.use('/itinerary', require('./middleware/auth').validateApiKey, itinerary_1.default);
// MapBox-only places route - public access for image/place lookups
app.use('/places', places_1.default);
// Usage/rate limit routes with auth middleware
app.use('/usage', require('./middleware/auth').validateApiKey, usage_1.default);
// Global error handler
app.use((err, req, res, next) => {
    console.error('🔥 Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Listening on port ${PORT}`);
    console.log(`[SERVER] Local: http://localhost:${PORT}`);
    console.log(`[SERVER] Network: http://0.0.0.0:${PORT}`);
});
