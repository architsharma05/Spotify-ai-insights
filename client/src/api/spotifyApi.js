import { apiFetch } from "./apiClient";

export function fetchProfile() {
  return apiFetch("/me");
}

export function fetchPlaylists() {
  return apiFetch("/playlists");
}

export function fetchPlaylistTracks(id) {
  return apiFetch(`/playlists/${id}/tracks`);
}

export function fetchPlaylistAnalysis(id, name) {
  return apiFetch(`/playlists/${id}/analysis?name=${encodeURIComponent(name)}`);
}

export function fetchAudioFeatures(trackId) {
  return apiFetch(`/audio-features/${trackId}`);
}

export function fetchTrackInsight(track, audioFeatures) {
  return apiFetch("/insights/track", {
    method: "POST",
    body: JSON.stringify({ track, audioFeatures }),
  });
}

export function logout() {
  return apiFetch("/logout", { method: "POST" });
}
