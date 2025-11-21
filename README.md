# VoyageAI

A full-stack travel planning application with AI-powered chat and itinerary management.

## Tech Stack

- Frontend: Expo React Native
- Backend: Node.js + Express + TypeScript
- AI: DeepSeek Chat API

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- DeepSeek API key

## Setup

### Backend

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add the required secrets:
   - `API_KEY` – backend auth shared with the app
   - `OPENAI_API_KEY` – DeepSeek-compatible key
   - `MAPBOX_ACCESS_TOKEN` – used for place search + geocoding
   - `FOURSQUARE_API_KEY` – **(recommended)** for real venue photos: get Service API Key from https://location.foursquare.com/developer/
   - `PEXELS_API_KEY` – **(optional)** for high-quality fallback photos: get free key from https://www.pexels.com/api/
   - `USE_FOURSQUARE_PHOTOS` – optional flag to disable photos (set to `false`). Defaults to `true` when `FOURSQUARE_API_KEY` is present.

   **Photo priority**: Foursquare (real venue) → Pexels (curated stock) → Unsplash (random stock)

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Use the Expo Go app on your device or an emulator to run the application.

## Development

- Backend runs on `http://localhost:3000`
- Frontend runs on `http://localhost:19006`
- API documentation available at `/api-docs` when server is running

## Publish

### Start demo server
To start a development server for testing:

```bash
npm run start:demo
```

This will start a tunneled development server that you can access from anywhere. Scan the QR code with Expo Go or visit the provided URL.

### Deploy to Bolt.new

This app is configured for easy deployment to Bolt.new:

1. **Visit [bolt.new](https://bolt.new)**
2. **Connect your GitHub repository**
3. **Select this repository**
4. **Deploy automatically**

The app will be available at a public URL like: `https://voyageai.bolt.new`

#### Environment Variables
The following environment variables are automatically configured:
- `EXPO_PUBLIC_API_BASE`: Points to your Render backend
- `API_KEY`: Authentication key for the backend

## Features

- AI-powered chat for travel planning
- Itinerary management
- Real-time updates
- Cross-platform support (iOS/Android)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
