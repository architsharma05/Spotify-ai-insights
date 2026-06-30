import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { createPlaylistInsight, createTrackInsight } from "./services/insightService.js";
import { createAiTrackInsight } from "./services/aiInsightService.js";

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

const DEFAULT_CLIENT_URL = "http://localhost:5173";
const DEFAULT_PORT = 4000;
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
const TOKEN_EXPIRY_BUFFER_MS = 60_000;
const SESSION_COOKIE_NAME = "spotify_session_id";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const config = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  clientUrl: process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  cookieSecure: process.env.COOKIE_SECURE === "true",
  aiInsightsEnabled: process.env.AI_INSIGHTS_ENABLED === "true",
  openAiModel: process.env.OPENAI_MODEL || "gpt-5.5",
};

export const sessionStore = new Map();

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());

export function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const name = cookie.slice(0, separatorIndex);
      const value = cookie.slice(separatorIndex + 1);
      cookies[name] = decodeURIComponent(value);

      return cookies;
    }, {});
}

function getCookieOptions(maxAge = SESSION_MAX_AGE_MS) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    maxAge,
  };
}

export function createSession(tokenData) {
  const sessionId = crypto.randomUUID();
  const expiresInMs = tokenData.expires_in * 1000;

  sessionStore.set(sessionId, {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + expiresInMs,
    createdAt: Date.now(),
  });

  return sessionId;
}

function setSessionCookie(res, sessionId) {
  res.cookie(SESSION_COOKIE_NAME, sessionId, getCookieOptions());
}

function getSessionId(req) {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];
}

function clearAuthSession(req, res) {
  const sessionId = getSessionId(req);

  if (sessionId) {
    sessionStore.delete(sessionId);
  }

  res.clearCookie(SESSION_COOKIE_NAME, getCookieOptions(0));
}

async function refreshAccessToken(refreshToken) {
  const response = await axios.post(
    SPOTIFY_TOKEN_URL,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data;
}

async function getValidAccessToken(req) {
  const sessionId = getSessionId(req);
  const session = sessionStore.get(sessionId);

  if (!session) {
    return null;
  }

  const isExpired = Date.now() > session.expiresAt - TOKEN_EXPIRY_BUFFER_MS;

  if (!isExpired) {
    return session.accessToken;
  }

  if (!session.refreshToken) {
    sessionStore.delete(sessionId);
    return null;
  }

  const refreshedTokenData = await refreshAccessToken(session.refreshToken);
  const expiresInMs = refreshedTokenData.expires_in * 1000;

  sessionStore.set(sessionId, {
    ...session,
    accessToken: refreshedTokenData.access_token,
    refreshToken: refreshedTokenData.refresh_token || session.refreshToken,
    expiresAt: Date.now() + expiresInMs,
  });

  return refreshedTokenData.access_token;
}

async function requireSpotifyToken(req, res, next) {
  try {
    const accessToken = await getValidAccessToken(req);

    if (!accessToken) {
      return res.status(401).json({ error: "Missing or expired Spotify session" });
    }

    req.spotifyAccessToken = accessToken;
    return next();
  } catch (err) {
    console.error("Error refreshing Spotify token:", err.response?.data || err.message);
    clearAuthSession(req, res);
    return res.status(401).json({ error: "Spotify session expired" });
  }
}

async function spotifyGet(path, accessToken) {
  const response = await axios.get(`${SPOTIFY_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}

app.get("/", (req, res) => {
  res.send("Spotify backend is running!");
});

app.get("/login", (req, res) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
    "user-read-playback-state",
    "streaming",
  ].join(" ");

  const queryParams = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: scopes,
    show_dialog: "true",
  });

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams.toString()}`);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    const response = await axios.post(
      SPOTIFY_TOKEN_URL,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const sessionId = createSession(response.data);
    setSessionCookie(res, sessionId);
    res.redirect(config.clientUrl);
  } catch (err) {
    console.error("Error exchanging code for token:", err.response?.data || err.message);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.post("/logout", (req, res) => {
  clearAuthSession(req, res);
  res.status(204).send();
});

app.get("/me", requireSpotifyToken, async (req, res) => {
  try {
    const data = await spotifyGet("/me", req.spotifyAccessToken);
    res.json(data);
  } catch (err) {
    console.error("Error fetching profile:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

app.get("/playlists", requireSpotifyToken, async (req, res) => {
  try {
    const data = await spotifyGet("/me/playlists", req.spotifyAccessToken);
    res.json(data);
  } catch (err) {
    console.error("Error fetching playlists:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

app.get("/playlists/:id/tracks", requireSpotifyToken, async (req, res) => {
  try {
    const data = await spotifyGet(`/playlists/${req.params.id}/tracks`, req.spotifyAccessToken);
    res.json(data);
  } catch (err) {
    console.error("Error fetching playlist tracks:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

app.get("/audio-features/:id", requireSpotifyToken, async (req, res) => {
  try {
    const data = await spotifyGet(`/audio-features/${req.params.id}`, req.spotifyAccessToken);
    res.json(data);
  } catch (err) {
    console.error("Error fetching audio features:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch audio features" });
  }
});

app.post("/insights/track", requireSpotifyToken, async (req, res) => {
  const { track, audioFeatures } = req.body;

  if (!audioFeatures) {
    return res.status(400).json({ error: "Missing audio features" });
  }

  const fallbackInsight = createTrackInsight({ track, audioFeatures });
  const insight = await createAiTrackInsight({ track, audioFeatures, fallbackInsight });

  return res.json(insight);
});

app.get("/playlists/:id/analysis", requireSpotifyToken, async (req, res) => {
  try {
    const playlistTracks = await spotifyGet(`/playlists/${req.params.id}/tracks`, req.spotifyAccessToken);
    const tracks = (playlistTracks.items || [])
      .map((item) => normalizePlaylistTrack(item))
      .filter(Boolean)
      .slice(0, 25);

    const tracksWithFeatures = await Promise.all(
      tracks.map(async (track) => {
        try {
          const audioFeatures = await spotifyGet(`/audio-features/${track.id}`, req.spotifyAccessToken);
          return { ...track, audioFeatures };
        } catch (err) {
          console.error(`Error fetching audio features for ${track.id}:`, err.response?.data || err.message);
          return track;
        }
      })
    );

    res.json(createPlaylistInsight({
      playlistName: req.query.name || "Selected playlist",
      tracks: tracksWithFeatures,
    }));
  } catch (err) {
    console.error("Error generating playlist analysis:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze playlist" });
  }
});

function normalizePlaylistTrack(item) {
  const track = item.track;

  if (!track?.id) {
    return null;
  }

  return {
    id: track.id,
    name: track.name,
    artist: track.artists?.[0]?.name || "Unknown artist",
    album: track.album?.name || "Unknown album",
    image: track.album?.images?.[0]?.url,
  };
}

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Server is running at http://127.0.0.1:${config.port}`);
  });
}

export default app;
