export function UserProfile({ user, onLogout }) {
  return (
    <>
      {user.images?.[0]?.url && (
        <img src={user.images[0].url} alt="profile" className="w-24 h-24 rounded-full mb-4" />
      )}
      <h1 className="text-2xl font-bold">{user.display_name}</h1>
      <p className="text-gray-400 mb-4">{user.email}</p>
      <button onClick={onLogout} className="bg-red-500 px-4 py-2 rounded-lg mb-8">
        Log Out
      </button>
    </>
  );
}
