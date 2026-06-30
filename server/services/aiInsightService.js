import axios from "axios";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export function isAiInsightEnabled(config = process.env) {
  return config.AI_INSIGHTS_ENABLED === "true" && Boolean(config.OPENAI_API_KEY);
}

export async function createAiTrackInsight({ track, audioFeatures, fallbackInsight, config = process.env }) {
  if (!isAiInsightEnabled(config)) {
    return { ...fallbackInsight, source: "fallback" };
  }

  try {
    const response = await axios.post(
      OPENAI_RESPONSES_URL,
      {
        model: config.OPENAI_MODEL || "gpt-5.5",
        input: buildTrackPrompt({ track, audioFeatures, fallbackInsight }),
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const parsedInsight = parseResponseJson(response.data);

    return {
      ...fallbackInsight,
      ...parsedInsight,
      analysis: fallbackInsight.analysis,
      source: "openai",
    };
  } catch (err) {
    console.error("Error generating OpenAI track insight:", err.response?.data || err.message);
    return { ...fallbackInsight, source: "fallback" };
  }
}

function buildTrackPrompt({ track, audioFeatures, fallbackInsight }) {
  return [
    "You are a concise music analyst for a Spotify insights app.",
    "Return ONLY valid JSON with these fields: title, summary, listeningContext, productionNotes.",
    "productionNotes must be an array of 1 to 3 short strings.",
    "Avoid claiming to know lyrics unless lyrics are provided.",
    "Use the fallback analysis as grounding and do not mention raw implementation details.",
    JSON.stringify({ track, audioFeatures, fallbackInsight }),
  ].join("\n");
}

function parseResponseJson(data) {
  const text = extractResponseText(data);

  if (!text) {
    return {};
  }

  const cleanedText = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleanedText);

  return {
    title: typeof parsed.title === "string" ? parsed.title : undefined,
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
    listeningContext: typeof parsed.listeningContext === "string" ? parsed.listeningContext : undefined,
    productionNotes: Array.isArray(parsed.productionNotes) ? parsed.productionNotes.filter((note) => typeof note === "string") : undefined,
  };
}

function extractResponseText(data) {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  const message = data?.output?.find((item) => item.type === "message");
  const textContent = message?.content?.find((item) => item.type === "output_text" || item.type === "text");

  return textContent?.text || "";
}
