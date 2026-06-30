import { API_BASE_URL } from "../api/apiClient";

export function LoginScreen() {
  return (
    <>
      <h1 className="text-4xl font-bold mb-6">Spotify AI Insights</h1>
      <p className="text-gray-400 mb-6 max-w-xl text-center">
        Connect Spotify to explore your playlists, tracks, and audio features.
      </p>
      <button
        onClick={() => {
          window.location.href = `${API_BASE_URL}/login`;
        }}
        className="bg-green-500 px-6 py-3 rounded-lg text-lg font-semibold"
      >
        Login with Spotify
      </button>
    </>
  );
}
