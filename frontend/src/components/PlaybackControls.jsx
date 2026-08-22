import { useEffect, useState } from "react";

export default function PlaybackControls({
  playerRef,
  videoState,
  canControl,
  onPlay,
  onPause,
  onSeek,
}) {
  const [currentTime, setCurrentTime] = useState(
    videoState?.currentTime || 0
  );

  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setCurrentTime(videoState?.currentTime || 0);
  }, [videoState?.currentTime, videoState?.videoId]);

  useEffect(() => {
    if (!canControl) return;

    const interval = setInterval(() => {
      const player = playerRef?.current;

      if (!player) return;

      try {
        const time = player.getCurrentTime?.() || 0;
        const total = player.getDuration?.() || 0;

        setCurrentTime(time);
        setDuration(total);
      } catch {
        // YouTube player not ready
      }
    }, 500);

    return () => clearInterval(interval);
  }, [canControl, playerRef]);

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  function handleSeek(e) {
    const time = Number(e.target.value);

    setCurrentTime(time);
    onSeek?.(time);
  }

  if (!canControl) {
    return (
      <div className="mt-3 bg-reel-900 border border-reel-700 rounded-xl px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-reel-400 text-sm">
          <span>🔒</span>
          <span>
            Playback is controlled by the Host or Moderator
          </span>
        </div>
      </div>
    );
  }

  const isPlaying = videoState?.playState === "playing";

  return (
    <div className="mt-3 bg-reel-900 border border-reel-700 rounded-xl p-4">
      {/* Control buttons */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-marquee text-reel-950 font-bold hover:brightness-110 transition"
          title={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <span className="text-xs text-reel-400 w-12 text-center">
          {formatTime(currentTime)}
        </span>

        {/* Seek bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          disabled={!duration}
          className="flex-1 accent-[#F2C14E] cursor-pointer disabled:opacity-40"
          aria-label="Video progress"
        />

        <span className="text-xs text-reel-400 w-12 text-center">
          {formatTime(duration)}
        </span>
      </div>

      {/* Role information */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-reel-500">
          Playback controls
        </span>

        <span className="text-[11px] text-signal-teal">
          Host / Moderator
        </span>
      </div>
    </div>
  );
}