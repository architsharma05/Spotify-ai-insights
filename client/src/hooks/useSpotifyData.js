import { useEffect, useState } from "react";
import {
  fetchAudioFeatures,
  fetchPlaylistAnalysis,
  fetchPlaylistTracks,
  fetchPlaylists,
  fetchProfile,
  fetchTrackInsight,
  logout,
} from "../api/spotifyApi";

function normalizeTrackItem(item) {
  return {
    id: item.track.id,
    name: item.track.name,
    artist: item.track.artists[0]?.name || "Unknown artist",
    album: item.track.album.name,
    image: item.track.album.images[0]?.url,
  };
}

export function useSpotifyData() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [selectedPlaylistName, setSelectedPlaylistName] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playlistAnalysis, setPlaylistAnalysis] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [trackInsight, setTrackInsight] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("Checking Spotify session...");
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    setLoadingMessage("Loading profile...");
    fetchProfile()
      .then((data) => {
        setUser(data);
        setErrorMessage(null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoadingMessage(null));
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoadingMessage("Loading playlists...");
    fetchPlaylists()
      .then((data) => {
        setPlaylists(data.items || []);
        setErrorMessage(null);
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoadingMessage(null));
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setPlaylists([]);
      setSelectedTracks([]);
      setSelectedPlaylistName(null);
      setSelectedTrack(null);
      setPlaylistAnalysis(null);
      setAudioFeatures(null);
      setTrackInsight(null);
      setErrorMessage(null);
    }
  };

  const selectPlaylist = (id, name) => {
    setLoadingMessage(`Loading tracks from ${name}...`);
    setSelectedTrack(null);
    setPlaylistAnalysis(null);
    setAudioFeatures(null);
    setTrackInsight(null);

    fetchPlaylistTracks(id)
      .then((data) => {
        const tracks = (data.items || []).filter((item) => item.track).map(normalizeTrackItem);
        setSelectedTracks(tracks);
        setSelectedPlaylistName(name);
        setErrorMessage(null);
        return fetchPlaylistAnalysis(id, name);
      })
      .then((analysis) => setPlaylistAnalysis(analysis))
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoadingMessage(null));
  };

  const selectTrack = (track) => {
    setSelectedTrack(track);
    setLoadingMessage("Loading audio features...");
    setAudioFeatures(null);
    setTrackInsight(null);

    fetchAudioFeatures(track.id)
      .then(async (data) => {
        setAudioFeatures(data);
        const insight = await fetchTrackInsight(track, data);
        setTrackInsight(insight);
        setErrorMessage(null);
      })
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoadingMessage(null));
  };

  const clearSelectedTrack = () => {
    setSelectedTrack(null);
    setAudioFeatures(null);
    setTrackInsight(null);
  };

  return {
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
  };
}
