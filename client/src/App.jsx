import { useState, useEffect } from "react";

function App() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);

  // Grab token from URL if redirected from Spotify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromURL = params.get("access_token");
    if (tokenFromURL) {
      localStorage.setItem("access_token", tokenFromURL);
      window.history.replaceState(null, null, "/");
    }
  }, []);

  // Fetch user profile
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch("http://127.0.0.1:4000/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch((err) => console.error("User fetch error:", err));
    }
  }, []);

  // Fetch playlists after user loads
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && user) {
      fetch("http://127.0.0.1:4000/playlists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setPlaylists(data.items || []))
        .catch((err) => console.error("Playlist fetch error:", err));
    }
  }, [user]);

  const handleLogin = () => {
    window.location.href = "http://127.0.0.1:4000/login";
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.reload();
  };

  // Fetch audio features for a given track
  const fetchAudioFeatures = (trackId) => {
    console.log("🎯 FETCH AUDIO FEATURES for:", trackId);
    const token = localStorage.getItem("access_token");
    fetch(`http://127.0.0.1:4000/audio-features/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {console.log("🎧 AUDIO DATA RETURNED TO FRONTEND:", data);
                      setAudioFeatures(data)})
      .catch((err) => console.error("Audio features error:", err));
  };

  // Fetch tracks for a given playlist
  const fetchTracks = (id, name) => {
    const token = localStorage.getItem("access_token");
    fetch(`http://127.0.0.1:4000/playlists/${id}/tracks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const tracks = data.items.map((item) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name,
          album: item.track.album.name,
          image: item.track.album.images[0]?.url,
        }));
        setSelectedTracks(tracks);
        setSelectedPlaylistName(name);
      })
      .catch((err) => console.error("Track fetch error:", err));
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      {!user ? (
        <>
          <h1 className="text-4xl font-bold mb-6">Spotify AI Insights</h1>
          <button
            onClick={handleLogin}
            className="bg-green-500 px-6 py-3 rounded-lg text-lg font-semibold"
          >
            Login with Spotify
          </button>
        </>
      ) : (
        <>
          {/* User Info */}
          <img
            src={user.images?.[0]?.url}
            alt="profile"
            className="w-24 h-24 rounded-full mb-4"
          />
          <h1 className="text-2xl font-bold">{user.display_name}</h1>
          <p className="text-gray-400 mb-4">{user.email}</p>

          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded-lg mb-8"
          >
            Log Out
          </button>

          {/* Playlists */}
          <h2 className="text-xl font-semibold mb-2">Your Playlists</h2>
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

          {/* Tracks */}
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
                  <img
                    src={track.image}
                    alt="cover"
                    className="w-12 h-12 rounded"
                  />
                  <div>
                    <p className="font-bold">{track.name}</p>
                    <p className="text-sm text-gray-400">{track.artist}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* ✅ Move modal below the ul */}
            {selectedTrack && audioFeatures && (
              <div className="mt-10 bg-white/10 p-6 rounded-lg w-full max-w-2xl">
                <h3 className="text-2xl font-bold mb-2">{selectedTrack.name}</h3>
                <p className="text-gray-400 mb-4">by {selectedTrack.artist}</p>

                <img
                  src={selectedTrack.image}
                  alt="cover"
                  className="w-32 h-32 rounded mb-4"
                />

                <h4 className="text-lg font-semibold mb-2">Audio Features</h4>
                <ul className="space-y-1 text-sm text-gray-200">
                  <li>🎶 Danceability: {audioFeatures.danceability ?? "N/A"}</li>
                  <li>⚡ Energy: {audioFeatures.energy ?? "N/A"}</li>
                  <li>😊 Valence: {audioFeatures.valence ?? "N/A"}</li>
                  <li>🎚️ Acousticness: {audioFeatures.acousticness ?? "N/A"}</li>
                  <li>🔥 Liveness: {audioFeatures.liveness ?? "N/A"}</li>
                  <li>
                    🎵 Tempo:{" "}
                    {audioFeatures.tempo ? audioFeatures.tempo.toFixed(1) : "N/A"} BPM
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
    </div>
  );
}

export default App;
