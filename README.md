# Spotify AI Insights

A Spotify companion app for exploring playlists, track audio features, mood analysis, and future AI-powered music insights.

## Current features

- Spotify OAuth login through the Express backend.
- Server-side Spotify token sessions with an HTTP-only session cookie.
- Spotify profile and playlist browsing.
- Playlist track browsing.
- Track-level audio feature display.
- Rule-based track mood summaries from Spotify audio features.
- Backend-generated track insights with optional OpenAI-powered generation and deterministic fallback.
- Playlist-level mood analysis with averages and standout tracks.
- Frontend loading, empty, and error states.

## Project structure

```txt
Spotify-ai-insights/
  client/   # Vite + React frontend
  server/   # Express backend and Spotify API proxy
```

## Prerequisites

- Node.js 20 or newer recommended.
- A Spotify developer application.
- A Spotify redirect URI configured for the backend callback, for example:
  `http://127.0.0.1:4000/callback`

## Environment variables

Create `server/.env`:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://127.0.0.1:4000/callback
COOKIE_SECURE=false
AI_INSIGHTS_ENABLED=false
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.5
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:4000
```

For production, set `COOKIE_SECURE=true` and use HTTPS URLs.

## Install and run

Install both backend and frontend dependencies from the repo root:

```bash
npm run install:all
```

Start the backend and frontend together from the repo root:

```bash
npm run dev
```

This starts the Express backend on `http://127.0.0.1:4000` and the Vite frontend on `http://localhost:5173`. Open the Vite URL and log in with Spotify.

You can still run each app separately if needed:

```bash
npm --prefix server start
npm --prefix client run dev
```

## Quality checks

Run checks from the repo root:

```bash
npm run lint
npm run build
npm test
```

## Phase 4 and 5 improvements completed

- Added optional OpenAI-powered track insight generation using the Responses API with deterministic fallback when AI is disabled or unavailable.
- Added playlist-level analysis that summarizes average energy, valence, danceability, tempo, listening context, and standout tracks.
- Added a playlist mood card in the frontend track list view.

## Phase 2 and 3 improvements completed

- Added reusable mood analysis from audio features.
- Added readable mood labels, tags, tempo labels, and feature levels in the track view.
- Added a backend `/insights/track` endpoint that generates structured track insight copy from the selected track and its audio features.
- Added insight-service unit tests for mood classification and generated insight output.

## Phase 1 improvements completed

- Removed access-token exposure from the frontend redirect URL.
- Moved Spotify tokens into server-side sessions keyed by an HTTP-only cookie.
- Added refresh-token support for expired access tokens.
- Removed sensitive token logging.
- Moved client/backend URLs and backend port to environment variables.
- Added basic frontend loading/error states.
- Replaced the placeholder backend test script with Node's built-in test runner.

## Architecture cleanup completed

- Split the main React app into API helpers, a Spotify data hook, and focused UI components.
- Removed duplicate frontend mood-analysis rules; track mood display now uses backend insight analysis.
- Replaced token-bearing cookies with a server-side session store keyed by an HTTP-only session cookie.
- Added route-level tests for authenticated insight access and logout session cleanup.
