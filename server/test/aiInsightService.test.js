import test from "node:test";
import assert from "node:assert/strict";
import { isAiInsightEnabled, createAiTrackInsight } from "../services/aiInsightService.js";

test("isAiInsightEnabled requires both flag and API key", () => {
  assert.equal(isAiInsightEnabled({ AI_INSIGHTS_ENABLED: "false", OPENAI_API_KEY: "key" }), false);
  assert.equal(isAiInsightEnabled({ AI_INSIGHTS_ENABLED: "true" }), false);
  assert.equal(isAiInsightEnabled({ AI_INSIGHTS_ENABLED: "true", OPENAI_API_KEY: "key" }), true);
});

test("createAiTrackInsight returns fallback when AI is disabled", async () => {
  const fallbackInsight = {
    title: "Fallback",
    summary: "Fallback summary",
    listeningContext: "Fallback context",
    productionNotes: ["Fallback note"],
    analysis: { mood: "Balanced" },
  };

  const insight = await createAiTrackInsight({
    track: { name: "Test" },
    audioFeatures: { energy: 0.5 },
    fallbackInsight,
    config: { AI_INSIGHTS_ENABLED: "false" },
  });

  assert.equal(insight.title, "Fallback");
  assert.equal(insight.source, "fallback");
});
