export function TrackInsightPanel({ track, audioFeatures, trackInsight, onClose }) {
  if (!track || !audioFeatures) return null;

  const analysis = trackInsight?.analysis;

  return (
    <div className="mt-10 bg-white/10 p-6 rounded-lg w-full max-w-2xl">
      <h3 className="text-2xl font-bold mb-2">{track.name}</h3>
      <p className="text-gray-400 mb-4">by {track.artist}</p>

      {track.image && <img src={track.image} alt="cover" className="w-32 h-32 rounded mb-4" />}

      {analysis && (
        <div className="mb-6 rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-left">
          <h4 className="text-lg font-semibold mb-2">Mood Summary</h4>
          <p className="text-green-200 font-semibold">{analysis.mood}</p>
          <p className="text-sm text-gray-200 mt-1">{analysis.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {analysis.tags.map((tag) => (
              <span key={tag} className="text-xs bg-green-500/20 text-green-100 px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
            <span className="text-xs bg-white/10 text-gray-100 px-2 py-1 rounded-full">{analysis.tempo}</span>
          </div>
        </div>
      )}

      {trackInsight && (
        <div className="mb-6 rounded-lg bg-purple-500/10 border border-purple-500/30 p-4 text-left">
          <h4 className="text-lg font-semibold mb-2">AI Insight</h4>
          <p className="text-purple-200 font-semibold">{trackInsight.title}</p>
          <p className="text-sm text-gray-200 mt-1">{trackInsight.summary}</p>
          <p className="text-sm text-gray-300 mt-3">{trackInsight.listeningContext}</p>
          <ul className="list-disc list-inside text-sm text-gray-300 mt-3 space-y-1">
            {trackInsight.productionNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <h4 className="text-lg font-semibold mb-2">Audio Features</h4>
      <ul className="space-y-1 text-sm text-gray-200">
        <li>🎶 Danceability: {audioFeatures.danceability ?? "N/A"} ({analysis?.levels.danceability})</li>
        <li>⚡ Energy: {audioFeatures.energy ?? "N/A"} ({analysis?.levels.energy})</li>
        <li>😊 Valence: {audioFeatures.valence ?? "N/A"} ({analysis?.levels.valence})</li>
        <li>🎚️ Acousticness: {audioFeatures.acousticness ?? "N/A"} ({analysis?.levels.acousticness})</li>
        <li>🔥 Liveness: {audioFeatures.liveness ?? "N/A"} ({analysis?.levels.liveness})</li>
        <li>🎵 Tempo: {audioFeatures.tempo ? audioFeatures.tempo.toFixed(1) : "N/A"} BPM</li>
      </ul>

      <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-500 rounded">
        Close
      </button>
    </div>
  );
}
