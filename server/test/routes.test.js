import test from "node:test";
import assert from "node:assert/strict";
import app, { createSession, sessionStore } from "../index.js";

function listen() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

function createTestSessionCookie() {
  const sessionId = createSession({
    access_token: "test-access-token",
    refresh_token: "test-refresh-token",
    expires_in: 3600,
  });

  return { sessionId, cookie: `spotify_session_id=${sessionId}` };
}

test("POST /insights/track requires an authenticated session", async () => {
  const { server, baseUrl } = await listen();

  try {
    const response = await fetch(`${baseUrl}/insights/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioFeatures: { energy: 0.5, valence: 0.5 } }),
    });

    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});

test("POST /insights/track returns fallback insight for authenticated sessions", async () => {
  const { server, baseUrl } = await listen();
  const { cookie } = createTestSessionCookie();

  try {
    const response = await fetch(`${baseUrl}/insights/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        track: { name: "Route Song", artist: "Route Artist" },
        audioFeatures: { energy: 0.9, valence: 0.8, danceability: 0.8, tempo: 145 },
      }),
    });
    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.source, "fallback");
    assert.equal(data.analysis.mood, "Upbeat and energizing");
  } finally {
    server.close();
  }
});

test("POST /logout clears the server-side session", async () => {
  const { server, baseUrl } = await listen();
  const { sessionId, cookie } = createTestSessionCookie();

  try {
    const response = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });

    assert.equal(response.status, 204);
    assert.equal(sessionStore.has(sessionId), false);
  } finally {
    server.close();
  }
});
