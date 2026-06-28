# Spotify AI Insights

A Spotify companion app for exploring playlists, track audio features, mood analysis, and future AI-powered music insights.

## Current features

- Spotify OAuth login through the Express backend.
- Secure HTTP-only cookie session for Spotify tokens.
- Spotify profile and playlist browsing.
- Playlist track browsing.
- Track-level audio feature display.
- Rule-based track mood summaries from Spotify audio features.
- Backend-generated AI-style track insights with listening context and production notes.
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
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:4000
```

For production, set `COOKIE_SECURE=true` and use HTTPS URLs.

## Install and run

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd client
npm install
```

Start the backend:

```bash
cd server
npm start
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`, and log in with Spotify.

## Quality checks

Run frontend checks:

```bash
cd client
npm run lint
npm run build
```

Run backend tests:

```bash
cd server
npm test
```

## Phase 2 and 3 improvements completed

- Added reusable mood analysis from audio features.
- Added readable mood labels, tags, tempo labels, and feature levels in the track view.
- Added a backend `/insights/track` endpoint that generates structured track insight copy from the selected track and its audio features.
- Added insight-service unit tests for mood classification and generated insight output.

## Phase 1 improvements completed

- Removed access-token exposure from the frontend redirect URL.
- Moved Spotify tokens into HTTP-only cookies.
- Added refresh-token support for expired access tokens.
- Removed sensitive token logging.
- Moved client/backend URLs and backend port to environment variables.
- Added basic frontend loading/error states.
- Replaced the placeholder backend test script with Node's built-in test runner.
