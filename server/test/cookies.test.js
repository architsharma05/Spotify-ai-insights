import test from "node:test";
import assert from "node:assert/strict";
import { parseCookies } from "../index.js";

test("parseCookies returns an empty object when no cookies exist", () => {
  assert.deepEqual(parseCookies(), {});
});

test("parseCookies parses multiple encoded cookie values", () => {
  assert.deepEqual(
    parseCookies("spotify_access_token=abc123; spotify_refresh_token=refresh%20token; invalid"),
    {
      spotify_access_token: "abc123",
      spotify_refresh_token: "refresh token",
    }
  );
});
