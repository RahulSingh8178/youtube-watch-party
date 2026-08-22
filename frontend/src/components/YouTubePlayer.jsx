import { useEffect, useRef } from "react";

let ytApiPromise = null;

/** Loads the YouTube IFrame API script exactly once per page load. */
function loadYouTubeIframeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      resolve(window.YT);
    };

    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });

  return ytApiPromise;
}

const DRIFT_TOLERANCE_SECONDS = 1.5;
const REMOTE_APPLY_SUPPRESS_MS = 700;
const HEARTBEAT_INTERVAL_MS = 5000;

export default function YouTubePlayer({
  videoId,
  videoState,
  canControl,
  onPlay,
  onPause,
  onSeek,
  onHeartbeat,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const suppressUntilRef = useRef(0);
  const heartbeatTimerRef = useRef(null);

  const applyState = (state) => {
    const player = playerRef.current;

    if (!player || !readyRef.current || !state || !state.videoId) {
      return;
    }

    suppressUntilRef.current =
      Date.now() + REMOTE_APPLY_SUPPRESS_MS;

    const activeVideoId = (() => {
      try {
        return player.getVideoData()?.video_id;
      } catch {
        return null;
      }
    })();

    if (state.videoId !== activeVideoId) {
      player.loadVideoById(
        state.videoId,
        state.currentTime || 0
      );

      if (state.playState === "paused") {
        setTimeout(() => {
          try {
            player.pauseVideo();
          } catch {
            // Player may not be ready yet.
          }
        }, 400);
      }

      return;
    }

    try {
      const currentTime = player.getCurrentTime?.() || 0;
      const targetTime = state.currentTime || 0;

      const drift = Math.abs(currentTime - targetTime);

      if (drift > DRIFT_TOLERANCE_SECONDS) {
        player.seekTo(targetTime, true);
      }

      if (state.playState === "playing") {
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    } catch {
      // Player may not be fully ready.
    }
  };

  /*
   * Create YouTube player only when we actually have a videoId.
   */
  useEffect(() => {
    let destroyed = false;

    // IMPORTANT:
    // Do not initialize YouTube with null/undefined video ID.
    if (!videoId) {
      readyRef.current = false;
      return;
    }

    loadYouTubeIframeAPI().then((YT) => {
      if (destroyed || !containerRef.current || !videoId) {
        return;
      }

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,

        playerVars: {
          controls: canControl ? 1 : 0,
          disablekb: canControl ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },

        events: {
          onReady: () => {
            if (destroyed) return;

            readyRef.current = true;

            applyState(videoState);
          },

          onStateChange: (event) => {
            if (!canControl) return;

            if (Date.now() < suppressUntilRef.current) {
              return;
            }

            const YTState = window.YT.PlayerState;
            const player = playerRef.current;
            const time = player?.getCurrentTime?.() || 0;

            if (event.data === YTState.PLAYING) {
              onSeek?.(time);
              onPlay?.();
            } else if (event.data === YTState.PAUSED) {
              onSeek?.(time);
              onPause?.();
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;

      clearInterval(heartbeatTimerRef.current);

      readyRef.current = false;

      try {
        playerRef.current?.destroy?.();
      } catch {
        // Ignore destroy errors.
      }

      playerRef.current = null;
    };

    // Player is recreated when videoId/canControl changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, canControl]);

  /*
   * Apply new server state.
   */
  useEffect(() => {
    if (!readyRef.current) return;

    applyState(videoState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    videoState?.videoId,
    videoState?.playState,
    videoState?.currentTime,
    videoState?.updatedAt,
  ]);

  /*
   * Heartbeat for playback synchronization.
   */
  useEffect(() => {
    clearInterval(heartbeatTimerRef.current);

    if (!canControl || !onHeartbeat) {
      return;
    }

    heartbeatTimerRef.current = setInterval(() => {
      const player = playerRef.current;

      if (
        !player?.getCurrentTime ||
        player.getPlayerState?.() !==
          window.YT?.PlayerState?.PLAYING
      ) {
        return;
      }

      onHeartbeat(player.getCurrentTime());
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(heartbeatTimerRef.current);
    };
  }, [canControl, onHeartbeat]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-reel-700 shadow-2xl">
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
      />

      {!videoId && (
        <div className="absolute inset-0 flex items-center justify-center bg-reel-900 text-reel-400 text-sm">
          No video loaded yet.
        </div>
      )}
    </div>
  );
}