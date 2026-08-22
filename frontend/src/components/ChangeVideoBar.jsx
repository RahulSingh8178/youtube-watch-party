import { useState } from "react";
import { extractYouTubeId } from "../lib/youtube.js";

export default function ChangeVideoBar({ onChangeVideo }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const id = extractYouTubeId(value);
    if (!id) {
      setError("That doesn't look like a valid YouTube link or video ID.");
      return;
    }
    setError("");
    onChangeVideo(id);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste a YouTube link to change the video…"
        className="flex-1 bg-reel-800 border border-reel-600 rounded-lg px-3 py-2 text-sm text-reel-200 placeholder:text-reel-600 focus:border-signal-violet transition-colors"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-marquee text-reel-950 text-sm font-semibold hover:brightness-110 transition whitespace-nowrap"
      >
        Load video
      </button>
      {error && <p className="text-signal-rose text-xs sm:hidden">{error}</p>}
      {error && <p className="hidden sm:block text-signal-rose text-xs self-center">{error}</p>}
    </form>
  );
}
