import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../lib/api.js";
import { saveUsername, getSavedUsername } from "../lib/identity.js";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(getSavedUsername());
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState(null); // 'create' | 'join' | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!username.trim()) return setError("Pick a name first.");
    setError("");
    setLoading(true);
    try {
      const { roomId } = await createRoom();
      saveUsername(username.trim());
      navigate(`/room/${roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!username.trim()) return setError("Pick a name first.");
    if (!joinCode.trim()) return setError("Enter a room code to join.");
    saveUsername(username.trim());
    navigate(`/room/${joinCode.trim().toUpperCase()}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-marquee text-sm tracking-[0.3em] uppercase mb-3">
            <span className="h-px w-6 bg-marquee/60" />
            Now Screening
            <span className="h-px w-6 bg-marquee/60" />
          </div>
          <h1 className="font-display text-6xl sm:text-7xl tracking-wide text-reel-200 drop-shadow-marquee">
            Watch Party
          </h1>
          <p className="text-reel-400 mt-3 text-sm">
            Sync a YouTube video with friends, in real time, down to the second.
          </p>
        </div>

        <div className="bg-reel-900 border border-reel-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <label className="block text-xs uppercase tracking-widest text-reel-400 mb-2">
            Your name
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Jordan"
            maxLength={30}
            className="w-full bg-reel-800 border border-reel-600 rounded-lg px-4 py-3 text-reel-200 placeholder:text-reel-600 mb-6 focus:border-signal-violet transition-colors"
          />

          {mode !== "join" && (
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-marquee text-reel-950 font-semibold rounded-lg py-3 hover:brightness-110 transition disabled:opacity-60 mb-3"
            >
              {loading ? "Opening a room…" : "Start a new room"}
            </button>
          )}

          {mode !== "join" ? (
            <button
              onClick={() => setMode("join")}
              className="w-full text-reel-400 text-sm py-2 hover:text-reel-200 transition"
            >
              Have a room code? Join instead →
            </button>
          ) : (
            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-reel-400 mb-2">
                  Room code
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 7K2QXM"
                  maxLength={8}
                  className="w-full bg-reel-800 border border-reel-600 rounded-lg px-4 py-3 tracking-[0.3em] text-center font-display text-2xl text-marquee placeholder:text-reel-600 focus:border-signal-violet transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-signal-violet text-reel-950 font-semibold rounded-lg py-3 hover:brightness-110 transition"
              >
                Join room
              </button>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="w-full text-reel-400 text-sm py-1 hover:text-reel-200 transition"
              >
                ← Back
              </button>
            </form>
          )}

          {error && <p className="text-signal-rose text-sm mt-4 text-center">{error}</p>}
        </div>

        <p className="text-center text-reel-600 text-xs mt-8">
          Whoever starts a room becomes its Host and can promote friends to Moderator.
        </p>
      </div>
    </div>
  );
}
