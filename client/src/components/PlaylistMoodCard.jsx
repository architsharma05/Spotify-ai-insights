function formatFeature(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "N/A";
}

function formatTempo(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} BPM` : "N/A";
}

function formatStandout(track) {
  if (!track) return "N/A";
  return `${track.name} by ${track.artist} (${track.value.toFixed(2)})`;
}

export function PlaylistMoodCard({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="mb-6 rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 text-left">
      <h3 className="text-lg font-semibold mb-2">Playlist Mood</h3>
      <p className="text-blue-200 font-semibold">{analysis.title}</p>
      <p className="text-sm text-gray-200 mt-1">{analysis.summary}</p>
      <p className="text-sm text-gray-300 mt-3">{analysis.listeningContext}</p>
      <div className="grid grid-cols-2 gap-2 mt-4 text-sm text-gray-200">
        <p>⚡ Avg energy: {formatFeature(analysis.averages.energy)}</p>
        <p>😊 Avg valence: {formatFeature(analysis.averages.valence)}</p>
        <p>🎶 Avg danceability: {formatFeature(analysis.averages.danceability)}</p>
        <p>🎵 Avg tempo: {formatTempo(analysis.averages.tempo)}</p>
      </div>
      <div className="mt-4 text-sm text-gray-300 space-y-1">
        <p>Highest energy: {formatStandout(analysis.standouts.highestEnergy)}</p>
        <p>Most danceable: {formatStandout(analysis.standouts.mostDanceable)}</p>
        <p>Most positive: {formatStandout(analysis.standouts.mostPositive)}</p>
      </div>
    </div>
  );
}
