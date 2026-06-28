const FEATURE_LABELS = {
  danceability: "danceability",
  energy: "energy",
  valence: "positivity",
  acousticness: "acoustic texture",
  liveness: "live feel",
};

function readFeature(features, key) {
  const value = Number(features?.[key]);
  return Number.isFinite(value) ? value : null;
}

function featureLevel(value) {
  if (value === null) {
    return "unknown";
  }

  if (value >= 0.7) {
    return "high";
  }

  if (value <= 0.35) {
    return "low";
  }

  return "moderate";
}

function tempoLevel(tempo) {
  if (!Number.isFinite(tempo)) {
    return "unknown tempo";
  }

  if (tempo >= 140) {
    return "fast-paced";
  }

  if (tempo <= 85) {
    return "slow-burning";
  }

  return "mid-tempo";
}

export function analyzeAudioFeatures(features = {}) {
  const danceability = readFeature(features, "danceability");
  const energy = readFeature(features, "energy");
  const valence = readFeature(features, "valence");
  const acousticness = readFeature(features, "acousticness");
  const liveness = readFeature(features, "liveness");
  const tempo = Number(features.tempo);

  const tags = [];

  if (energy !== null && energy >= 0.75) tags.push("high-energy");
  if (energy !== null && energy <= 0.35) tags.push("chill");
  if (valence !== null && valence >= 0.7) tags.push("bright");
  if (valence !== null && valence <= 0.35) tags.push("moody");
  if (danceability !== null && danceability >= 0.7) tags.push("danceable");
  if (acousticness !== null && acousticness >= 0.65) tags.push("acoustic");
  if (liveness !== null && liveness >= 0.7) tags.push("live-sounding");

  let mood = "Balanced";

  if (energy !== null && valence !== null) {
    if (energy >= 0.7 && valence >= 0.65) {
      mood = "Upbeat and energizing";
    } else if (energy >= 0.7 && valence < 0.45) {
      mood = "Intense and dramatic";
    } else if (energy < 0.45 && valence >= 0.6) {
      mood = "Warm and relaxed";
    } else if (energy < 0.45 && valence < 0.45) {
      mood = "Reflective and mellow";
    }
  }

  return {
    mood,
    tags: tags.length ? tags : ["balanced"],
    tempo: tempoLevel(tempo),
    levels: Object.fromEntries(
      Object.keys(FEATURE_LABELS).map((key) => [key, featureLevel(readFeature(features, key))])
    ),
  };
}

export function createTrackInsight({ track = {}, audioFeatures = {} }) {
  const analysis = analyzeAudioFeatures(audioFeatures);
  const title = track.name || "This track";
  const artist = track.artist ? ` by ${track.artist}` : "";
  const tagSummary = analysis.tags.join(", ");

  return {
    title: `${analysis.mood} track`,
    summary: `${title}${artist} comes across as ${analysis.mood.toLowerCase()}, with a ${analysis.tempo} pulse and ${tagSummary} qualities.`,
    listeningContext: getListeningContext(analysis),
    productionNotes: getProductionNotes(audioFeatures, analysis),
    analysis,
  };
}

function getListeningContext(analysis) {
  if (analysis.tags.includes("high-energy") && analysis.tags.includes("danceable")) {
    return "Best fit for workouts, parties, driving, or any moment that needs momentum.";
  }

  if (analysis.tags.includes("chill") || analysis.mood.includes("mellow")) {
    return "Best fit for focused listening, late-night sessions, studying, or winding down.";
  }

  if (analysis.tags.includes("bright")) {
    return "Best fit for upbeat playlists, morning listening, or mood-lifting mixes.";
  }

  return "Best fit for a balanced playlist slot where you want flow without overwhelming the listener.";
}

function getProductionNotes(features, analysis) {
  const notes = [];

  if (analysis.levels.acousticness === "high") {
    notes.push("The acousticness score suggests a more organic texture.");
  }

  if (analysis.levels.liveness === "high") {
    notes.push("The liveness score gives it more of a performance or crowd-present feel.");
  }

  if (Number.isFinite(Number(features.tempo))) {
    notes.push(`The tempo sits around ${Number(features.tempo).toFixed(1)} BPM, making it ${analysis.tempo}.`);
  }

  return notes.length ? notes : ["The feature profile is balanced, so no single production trait dominates the track."];
}
