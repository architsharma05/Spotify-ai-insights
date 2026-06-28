import { LoginScreen } from "./components/LoginScreen";
import { PlaylistList } from "./components/PlaylistList";
import { TrackInsightPanel } from "./components/TrackInsightPanel";
import { TrackList } from "./components/TrackList";
import { UserProfile } from "./components/UserProfile";
import { useSpotifyData } from "./hooks/useSpotifyData";

function App() {
  const {
    user,
    playlists,
    selectedTracks,
    selectedPlaylistName,
    selectedTrack,
    playlistAnalysis,
    audioFeatures,
    trackInsight,
    loadingMessage,
    errorMessage,
    handleLogout,
    selectPlaylist,
    selectTrack,
    clearSelectedTrack,
  } = useSpotifyData();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      {!user ? (
        <LoginScreen />
      ) : (
        <>
          <UserProfile user={user} onLogout={handleLogout} />
          <PlaylistList playlists={playlists} loadingMessage={loadingMessage} onSelectPlaylist={selectPlaylist} />
          <TrackList
            tracks={selectedTracks}
            playlistName={selectedPlaylistName}
            playlistAnalysis={playlistAnalysis}
            onSelectTrack={selectTrack}
          />
          <TrackInsightPanel
            track={selectedTrack}
            audioFeatures={audioFeatures}
            trackInsight={trackInsight}
            onClose={clearSelectedTrack}
          />
        </>
      )}
      {loadingMessage && <p className="mt-6 text-gray-300">{loadingMessage}</p>}
      {errorMessage && <p className="mt-6 text-red-400">{errorMessage}</p>}
    </div>
  );
}

export default App;
