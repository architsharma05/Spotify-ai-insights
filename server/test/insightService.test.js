import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAudioFeatures, createTrackInsight } from "../services/insightService.js";

test("analyzeAudioFeatures labels upbeat high-energy tracks", () => {
  const analysis = analyzeAudioFeatures({
    danceability: 0.82,
    energy: 0.91,
    valence: 0.78,
    acousticness: 0.12,
    liveness: 0.2,
    tempo: 152,
  });

  assert.equal(analysis.mood, "Upbeat and energizing");
  assert.equal(analysis.tempo, "fast-paced");
  assert.ok(analysis.tags.includes("high-energy"));
  assert.ok(analysis.tags.includes("danceable"));
});

test("createTrackInsight returns user-facing insight copy", () => {
  const insight = createTrackInsight({
    track: { name: "Test Song", artist: "Test Artist" },
    audioFeatures: { energy: 0.25, valence: 0.3, tempo: 72 },
  });

  assert.equal(insight.title, "Reflective and mellow track");
  assert.match(insight.summary, /Test Song by Test Artist/);
  assert.match(insight.listeningContext, /focused listening|late-night|studying|winding down/);
  assert.equal(insight.analysis.mood, "Reflective and mellow");
});
