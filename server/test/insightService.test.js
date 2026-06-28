import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAudioFeatures, createPlaylistInsight, createTrackInsight } from "../services/insightService.js";

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


test("createPlaylistInsight summarizes averages and standout tracks", () => {
  const insight = createPlaylistInsight({
    playlistName: "Test Mix",
    tracks: [
      { id: "1", name: "Energetic", artist: "Artist A", audioFeatures: { energy: 0.95, danceability: 0.7, valence: 0.5, tempo: 150 } },
      { id: "2", name: "Happy", artist: "Artist B", audioFeatures: { energy: 0.4, danceability: 0.8, valence: 0.9, tempo: 110 } },
    ],
  });

  assert.match(insight.title, /Test Mix/);
  assert.equal(Number(insight.averages.energy.toFixed(2)), 0.68);
  assert.equal(insight.standouts.highestEnergy.name, "Energetic");
  assert.equal(insight.standouts.mostPositive.name, "Happy");
});
