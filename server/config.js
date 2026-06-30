import dotenv from "dotenv";

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

export const DEFAULT_CLIENT_URL = "http://localhost:5173";
export const DEFAULT_PORT = 4000;
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
export const TOKEN_EXPIRY_BUFFER_MS = 60_000;
export const SESSION_COOKIE_NAME = "spotify_session_id";
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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
