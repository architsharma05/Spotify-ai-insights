import { PlaylistMoodCard } from "./PlaylistMoodCard";

export function TrackList({ tracks, playlistName, playlistAnalysis, onSelectTrack }) {
  if (tracks.length === 0) return null;

  return (
    <div className="mt-10 w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Tracks in {playlistName}</h2>
      <PlaylistMoodCard analysis={playlistAnalysis} />
      <ul className="space-y-3">
        {tracks.map((track) => (
          <li
            key={track.id}
            onClick={() => onSelectTrack(track)}
            className="cursor-pointer bg-white/10 p-4 rounded-lg hover:bg-white/20 transition flex items-center space-x-4"
          >
            {track.image && <img src={track.image} alt="cover" className="w-12 h-12 rounded" />}
            <div>
              <p className="font-bold">{track.name}</p>
              <p className="text-sm text-gray-400">{track.artist}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
