import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function App() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Checking Spotify session...");
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    setLoadingMessage("Loading profile...");
    apiFetch("/me")
      .then((data) => {
        setUser(data);
        setErrorMessage(null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoadingMessage(null));
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setLoadingMessage("Loading playlists...");
    apiFetch("/playlists")
      .then((data) => {
        setPlaylists(data.items || []);
        setErrorMessage(null);
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoadingMessage(null));
  }, [user]);

  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/login`;
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } finally {
      setUser(null);
      setPlaylists([]);
      setSelectedTracks([]);
      setSelectedPlaylistName(null);
      setSelectedTrack(null);
      setAudioFeatures(null);
      setErrorMessage(null);
    }
  };

  const fetchAudioFeatures = (trackId) => {
    setLoadingMessage("Loading audio features...");
    setAudioFeatures(null);

    apiFetch(`/audio-features/${trackId}`)
      .then((data) => {
        setAudioFeatures(data);
        setErrorMessage(null);
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoadingMessage(null));
  };

  const fetchTracks = (id, name) => {
    setLoadingMessage(`Loading tracks from ${name}...`);
    setSelectedTrack(null);
    setAudioFeatures(null);

    apiFetch(`/playlists/${id}/tracks`)
      .then((data) => {
        const tracks = (data.items || [])
          .filter((item) => item.track)
          .map((item) => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0]?.name || "Unknown artist",
            album: item.track.album.name,
            image: item.track.album.images[0]?.url,
          }));

        setSelectedTracks(tracks);
        setSelectedPlaylistName(name);
        setErrorMessage(null);
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoadingMessage(null));
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      {!user ? (
        <>
          <h1 className="text-4xl font-bold mb-6">Spotify AI Insights</h1>
          <p className="text-gray-400 mb-6 max-w-xl text-center">
            Connect Spotify to explore your playlists, tracks, and audio features.
          </p>
          <button
            onClick={handleLogin}
            className="bg-green-500 px-6 py-3 rounded-lg text-lg font-semibold"
          >
            Login with Spotify
          </button>
        </>
      ) : (
        <>
          {user.images?.[0]?.url && (
            <img
              src={user.images[0].url}
              alt="profile"
              className="w-24 h-24 rounded-full mb-4"
            />
          )}
          <h1 className="text-2xl font-bold">{user.display_name}</h1>
          <p className="text-gray-400 mb-4">{user.email}</p>

          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded-lg mb-8"
          >
            Log Out
          </button>

          <h2 className="text-xl font-semibold mb-2">Your Playlists</h2>
          {playlists.length === 0 && !loadingMessage ? (
            <p className="text-gray-400">No playlists found.</p>
          ) : (
            <ul className="space-y-3 w-full max-w-xl">
              {playlists.map((pl) => (
                <li
                  key={pl.id}
                  onClick={() => fetchTracks(pl.id, pl.name)}
                  className="cursor-pointer bg-white/10 p-4 rounded-lg hover:bg-white/20 transition"
                >
                  <p className="font-bold">{pl.name}</p>
                  <p className="text-sm text-gray-400">{pl.tracks.total} songs</p>
                </li>
              ))}
            </ul>
          )}

          {selectedTracks.length > 0 && (
            <div className="mt-10 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">
                Tracks in {selectedPlaylistName}
              </h2>
              <ul className="space-y-3">
                {selectedTracks.map((track) => (
                  <li
                    key={track.id}
                    onClick={() => {
                      setSelectedTrack(track);
                      fetchAudioFeatures(track.id);
                    }}
                    className="cursor-pointer bg-white/10 p-4 rounded-lg hover:bg-white/20 transition flex items-center space-x-4"
                  >
                    {track.image && (
                      <img
                        src={track.image}
                        alt="cover"
                        className="w-12 h-12 rounded"
                      />
                    )}
                    <div>
                      <p className="font-bold">{track.name}</p>
                      <p className="text-sm text-gray-400">{track.artist}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {selectedTrack && audioFeatures && (
                <div className="mt-10 bg-white/10 p-6 rounded-lg w-full max-w-2xl">
                  <h3 className="text-2xl font-bold mb-2">{selectedTrack.name}</h3>
                  <p className="text-gray-400 mb-4">by {selectedTrack.artist}</p>

                  {selectedTrack.image && (
                    <img
                      src={selectedTrack.image}
                      alt="cover"
                      className="w-32 h-32 rounded mb-4"
                    />
                  )}

                  <h4 className="text-lg font-semibold mb-2">Audio Features</h4>
                  <ul className="space-y-1 text-sm text-gray-200">
                    <li>🎶 Danceability: {audioFeatures.danceability ?? "N/A"}</li>
                    <li>⚡ Energy: {audioFeatures.energy ?? "N/A"}</li>
                    <li>😊 Valence: {audioFeatures.valence ?? "N/A"}</li>
                    <li>🎚️ Acousticness: {audioFeatures.acousticness ?? "N/A"}</li>
                    <li>🔥 Liveness: {audioFeatures.liveness ?? "N/A"}</li>
                    <li>
                      🎵 Tempo: {audioFeatures.tempo ? audioFeatures.tempo.toFixed(1) : "N/A"} BPM
                    </li>
                  </ul>

                  <button
                    onClick={() => {
                      setSelectedTrack(null);
                      setAudioFeatures(null);
                    }}
                    className="mt-4 px-4 py-2 bg-red-500 rounded"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {loadingMessage && <p className="mt-6 text-gray-300">{loadingMessage}</p>}
      {errorMessage && <p className="mt-6 text-red-400">{errorMessage}</p>}
    </div>
  );
}

export default App;
