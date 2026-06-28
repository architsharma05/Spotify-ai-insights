import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { createTrackInsight } from "./services/insightService.js";

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

const DEFAULT_CLIENT_URL = "http://localhost:5173";
const DEFAULT_PORT = 4000;
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

export const config = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  clientUrl: process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  cookieSecure: process.env.COOKIE_SECURE === "true",
};

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

const DEFAULT_CLIENT_URL = "http://localhost:5173";
const DEFAULT_PORT = 4000;
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

export const config = {
  port: Number(process.env.PORT) || DEFAULT_PORT,
  clientUrl: process.env.CLIENT_URL || DEFAULT_CLIENT_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  cookieSecure: process.env.COOKIE_SECURE === "true",
};

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

function getAuthCookies(req) {
  return parseCookies(req.headers.cookie);
}

function getCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    maxAge,
  };
}

function setAuthCookies(res, tokenData) {
  const expiresInMs = tokenData.expires_in * 1000;
  const expiresAt = Date.now() + expiresInMs;

  res.cookie("spotify_access_token", tokenData.access_token, getCookieOptions(expiresInMs));
  res.cookie("spotify_token_expires_at", String(expiresAt), getCookieOptions(expiresInMs));

  if (tokenData.refresh_token) {
    res.cookie("spotify_refresh_token", tokenData.refresh_token, getCookieOptions(30 * 24 * 60 * 60 * 1000));
  }
}

function clearAuthCookies(res) {
  const options = getCookieOptions(0);

  res.clearCookie("spotify_access_token", options);
  res.clearCookie("spotify_refresh_token", options);
  res.clearCookie("spotify_token_expires_at", options);
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

async function getValidAccessToken(req, res) {
  const cookies = getAuthCookies(req);
  const accessToken = cookies.spotify_access_token;
  const refreshToken = cookies.spotify_refresh_token;
  const expiresAt = Number(cookies.spotify_token_expires_at);
  const isExpired = !expiresAt || Date.now() > expiresAt - TOKEN_EXPIRY_BUFFER_MS;

  if (accessToken && !isExpired) {
    return accessToken;
  }

  if (!refreshToken) {
    return null;
  }

  const refreshedTokenData = await refreshAccessToken(refreshToken);
  setAuthCookies(res, {
    ...refreshedTokenData,
    refresh_token: refreshedTokenData.refresh_token || refreshToken,
  });

  return refreshedTokenData.access_token;
}

async function requireSpotifyToken(req, res, next) {
  try {
    const accessToken = await getValidAccessToken(req, res);

    if (!accessToken) {
      return res.status(401).json({ error: "Missing or expired Spotify session" });
    }

    req.spotifyAccessToken = accessToken;
    return next();
  } catch (err) {
    console.error("Error refreshing Spotify token:", err.response?.data || err.message);
    clearAuthCookies(res);
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

    setAuthCookies(res, response.data);
    res.redirect(config.clientUrl);
  } catch (err) {
    console.error("Error exchanging code for token:", err.response?.data || err.message);
    res.status(500).json({ error: "Token exchange failed" });
  }
});

app.post("/logout", (req, res) => {
  clearAuthCookies(res);
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

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Server is running at http://127.0.0.1:${config.port}`);
  });
}

export default app;
