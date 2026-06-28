export function PlaylistList({ playlists, loadingMessage, onSelectPlaylist }) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-2">Your Playlists</h2>
      {playlists.length === 0 && !loadingMessage ? (
        <p className="text-gray-400">No playlists found.</p>
      ) : (
        <ul className="space-y-3 w-full max-w-xl">
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              onClick={() => onSelectPlaylist(playlist.id, playlist.name)}
              className="cursor-pointer bg-white/10 p-4 rounded-lg hover:bg-white/20 transition"
            >
              <p className="font-bold">{playlist.name}</p>
              <p className="text-sm text-gray-400">{playlist.tracks.total} songs</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
