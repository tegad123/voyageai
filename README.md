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
   Then edit `.env` and add your DeepSeek API key.

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

### Publish demo build
To publish a demo build to Expo Go:

```bash
EXPO_TOKEN=your_token EXPO_USERNAME=your_username npm run publish:demo
```

This will publish the current build to the `demo` release channel, making it available at:
`https://exp.host/@your_username/voyageai?release-channel=demo`

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
