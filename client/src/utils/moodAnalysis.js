function readFeature(features, key) {
  const value = Number(features?.[key]);
  return Number.isFinite(value) ? value : null;
}

function getLevel(value) {
  if (value === null) return "Unknown";
  if (value >= 0.7) return "High";
  if (value <= 0.35) return "Low";
  return "Moderate";
}

export function getMoodAnalysis(features = {}) {
  const energy = readFeature(features, "energy");
  const valence = readFeature(features, "valence");
  const danceability = readFeature(features, "danceability");
  const acousticness = readFeature(features, "acousticness");
  const tempo = Number(features.tempo);

  const tags = [];

  if (energy !== null && energy >= 0.75) tags.push("High energy");
  if (energy !== null && energy <= 0.35) tags.push("Chill");
  if (valence !== null && valence >= 0.7) tags.push("Bright");
  if (valence !== null && valence <= 0.35) tags.push("Moody");
  if (danceability !== null && danceability >= 0.7) tags.push("Danceable");
  if (acousticness !== null && acousticness >= 0.65) tags.push("Acoustic leaning");

  let mood = "Balanced";
  let description = "This track has a balanced feature profile without one dominant mood signal.";

  if (energy !== null && valence !== null) {
    if (energy >= 0.7 && valence >= 0.65) {
      mood = "Upbeat and energizing";
      description = "High energy and positive valence make this feel lively, bright, and momentum-building.";
    } else if (energy >= 0.7 && valence < 0.45) {
      mood = "Intense and dramatic";
      description = "High energy with lower valence points toward a more aggressive, tense, or dramatic feel.";
    } else if (energy < 0.45 && valence >= 0.6) {
      mood = "Warm and relaxed";
      description = "Lower energy with positive valence makes this feel easygoing, warm, and comfortable.";
    } else if (energy < 0.45 && valence < 0.45) {
      mood = "Reflective and mellow";
      description = "Lower energy and lower valence suggest a softer, more introspective mood.";
    }
  }

  return {
    mood,
    description,
    tags: tags.length ? tags : ["Balanced"],
    tempoLabel: Number.isFinite(tempo) ? getTempoLabel(tempo) : "Unknown tempo",
    levels: {
      danceability: getLevel(danceability),
      energy: getLevel(energy),
      valence: getLevel(valence),
      acousticness: getLevel(acousticness),
      liveness: getLevel(readFeature(features, "liveness")),
    },
  };
}

function getTempoLabel(tempo) {
  if (tempo >= 140) return "Fast-paced";
  if (tempo <= 85) return "Slow-burning";
  return "Mid-tempo";
}
