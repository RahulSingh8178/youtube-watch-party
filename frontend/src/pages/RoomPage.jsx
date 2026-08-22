import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { socket } from "../lib/socket.js";
import {
  getParticipantId,
  getSavedUsername,
  saveUsername,
} from "../lib/identity.js";

import YouTubePlayer from "../components/YouTubePlayer.jsx";
import PlaybackControls from "../components/PlaybackControls.jsx";
import ParticipantList from "../components/ParticipantList.jsx";
import Chat from "../components/Chat.jsx";
import ChangeVideoBar from "../components/ChangeVideoBar.jsx";

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // --------------------------------------------------
  // User / connection state
  // --------------------------------------------------

  const [username, setUsername] = useState(getSavedUsername());
  const [needsName, setNeedsName] = useState(!getSavedUsername());

  const [joined, setJoined] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [toast, setToast] = useState("");

  // --------------------------------------------------
  // Room state
  // --------------------------------------------------

  const [you, setYou] = useState(null);
  const [participants, setParticipants] = useState([]);

  const [videoState, setVideoState] = useState({
    videoId: "Rh1kt0Tmz-M",
    playState: "paused",
    currentTime: 0,
    updatedAt: 0,
  });

  const [messages, setMessages] = useState([]);

  // --------------------------------------------------
  // Toast
  // --------------------------------------------------

  const toastTimer = useRef(null);

  const showToast = useCallback((text) => {
    setToast(text);

    clearTimeout(toastTimer.current);

    toastTimer.current = setTimeout(() => {
      setToast("");
    }, 3500);
  }, []);

  // --------------------------------------------------
  // Socket connection + listeners
  // --------------------------------------------------

  useEffect(() => {
    socket.connect();

    const onConnectError = () => {
      setConnectionError(
        "Can't reach the watch party server. Retrying…"
      );
    };

    const onConnect = () => {
      setConnectionError("");
    };

    // ----------------------------------------------
    // Room joined
    // ----------------------------------------------

    const onRoomJoined = (data) => {
      setJoined(true);

      setYou(data.you);
      setParticipants(data.participants);

      setVideoState(data.videoState);

      setMessages(data.chatHistory || []);

      showToast(`Welcome ${data.you.username}!`);
    };

    // ----------------------------------------------
    // User joined
    // ----------------------------------------------

    const onUserJoined = (data) => {
      setParticipants(data.participants);

      showToast(`${data.username} joined`);
    };

    // ----------------------------------------------
    // User left
    // ----------------------------------------------

    const onUserLeft = (data) => {
      setParticipants(data.participants);

      showToast(`${data.username} left`);
    };

    // ----------------------------------------------
    // Playback synchronization
    // ----------------------------------------------

    const onSyncState = (state) => {
      setVideoState(state);
    };

    // ----------------------------------------------
    // Role assigned
    // ----------------------------------------------

    const onRoleAssigned = (data) => {
      setParticipants(data.participants);

      setYou((prev) => {
        if (!prev) return prev;

        const updated = data.participants.find(
          (p) => p.id === prev.id
        );

        return updated
          ? {
              ...prev,
              role: updated.role,
            }
          : prev;
      });

      showToast(
        `${data.username} is now ${data.role}`
      );
    };

    // ----------------------------------------------
    // Host changed
    // ----------------------------------------------

    const onHostChanged = (data) => {
      setParticipants(data.participants);

      setYou((prev) => {
        if (!prev) return prev;

        const updated = data.participants.find(
          (p) => p.id === prev.id
        );

        return updated
          ? {
              ...prev,
              role: updated.role,
            }
          : prev;
      });

      showToast(
        `${data.newHostUsername} is now the host`
      );
    };

    // ----------------------------------------------
    // Participant removed
    // ----------------------------------------------

    const onParticipantRemoved = (data) => {
      setParticipants(data.participants);
    };

    // ----------------------------------------------
    // You were removed
    // ----------------------------------------------

    const onYouWereRemoved = () => {
      alert(
        "You were removed from the room by the host."
      );

      navigate("/");
    };

    // ----------------------------------------------
    // Chat
    // ----------------------------------------------

    const onChatMessage = (message) => {
      setMessages((prev) => [
        ...prev,
        message,
      ]);
    };

    // ----------------------------------------------
    // Backend permission error
    // ----------------------------------------------

    const onActionError = (data) => {
      showToast(data.message);
    };

    // ----------------------------------------------
    // Register listeners
    // ----------------------------------------------

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);

    socket.on("room_joined", onRoomJoined);

    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);

    socket.on("sync_state", onSyncState);

    socket.on(
      "role_assigned",
      onRoleAssigned
    );

    socket.on(
      "host_changed",
      onHostChanged
    );

    socket.on(
      "participant_removed",
      onParticipantRemoved
    );

    socket.on(
      "you_were_removed",
      onYouWereRemoved
    );

    socket.on(
      "chat_message",
      onChatMessage
    );

    socket.on(
      "action_error",
      onActionError
    );

    // ----------------------------------------------
    // Cleanup
    // ----------------------------------------------

    return () => {
      socket.emit("leave_room");

      socket.off("connect", onConnect);
      socket.off(
        "connect_error",
        onConnectError
      );

      socket.off(
        "room_joined",
        onRoomJoined
      );

      socket.off(
        "user_joined",
        onUserJoined
      );

      socket.off(
        "user_left",
        onUserLeft
      );

      socket.off(
        "sync_state",
        onSyncState
      );

      socket.off(
        "role_assigned",
        onRoleAssigned
      );

      socket.off(
        "host_changed",
        onHostChanged
      );

      socket.off(
        "participant_removed",
        onParticipantRemoved
      );

      socket.off(
        "you_were_removed",
        onYouWereRemoved
      );

      socket.off(
        "chat_message",
        onChatMessage
      );

      socket.off(
        "action_error",
        onActionError
      );

      socket.disconnect();
    };

    // We intentionally connect only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------
  // Join room
  // --------------------------------------------------

  const attemptJoin = useCallback(
    (name) => {
      socket.emit("join_room", {
        roomId,
        username: name,
        participantId: getParticipantId(),
      });
    },
    [roomId]
  );

  // Join after socket connection
  useEffect(() => {
  if (needsName) return;

  if (socket.connected) {
    attemptJoin(username);
  } else {
    const handleConnect = () => {
      attemptJoin(username);
    };

    socket.once("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }
}, [needsName, attemptJoin]);

  // --------------------------------------------------
  // Name submit
  // --------------------------------------------------

  function handleNameSubmit(e) {
    e.preventDefault();

    if (!username.trim()) return;

    const cleanName = username.trim();

    saveUsername(cleanName);

    setUsername(cleanName);
    setNeedsName(false);
  }

  // --------------------------------------------------
  // Role permissions
  // --------------------------------------------------

  const isHost =
    you?.role === "host";

  const isModerator =
    you?.role === "moderator";

  const isParticipant =
    you?.role === "participant";

  const canControl =
    isHost || isModerator;

  // --------------------------------------------------
  // Copy invite
  // --------------------------------------------------

  const copyInvite = async () => {
    try {
      await navigator.clipboard?.writeText(
        window.location.href
      );

      showToast("Invite link copied");
    } catch {
      showToast("Could not copy invite link");
    }
  };

  // --------------------------------------------------
  // Loading / name screen
  // --------------------------------------------------

  if (needsName) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">

        <form
          onSubmit={handleNameSubmit}
          className="w-full max-w-sm bg-reel-900 border border-reel-700 rounded-2xl p-6"
        >
          <h1 className="font-display text-3xl text-reel-200 mb-1">
            Joining room {roomId}
          </h1>

          <p className="text-reel-400 text-sm mb-5">
            Pick a name to enter the room.
          </p>

          <input
            autoFocus
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            placeholder="e.g. Jordan"
            maxLength={30}
            className="w-full bg-reel-800 border border-reel-600 rounded-lg px-4 py-3 text-reel-200 placeholder:text-reel-600 mb-4 focus:border-signal-violet transition-colors"
          />

          <button
            type="submit"
            className="w-full bg-marquee text-reel-950 font-semibold rounded-lg py-3 hover:brightness-110 transition"
          >
            Enter room
          </button>
        </form>
      </div>
    );
  }

  // --------------------------------------------------
  // Main room UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-6xl mx-auto">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">

        <div>
          <p className="text-marquee text-xs uppercase tracking-[0.3em] mb-1">
            Room
          </p>

          <h1 className="font-display text-4xl tracking-wide text-reel-200">
            {roomId}
          </h1>
        </div>

        <div className="flex items-center gap-3">

          {connectionError && (
            <span className="text-signal-rose text-xs">
              {connectionError}
            </span>
          )}

          <button
            onClick={copyInvite}
            className="text-sm px-4 py-2 rounded-lg bg-reel-800 border border-reel-700 text-reel-200 hover:border-signal-violet transition"
          >
            Copy invite link
          </button>

        </div>
      </header>

      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <div>

          {/* ----------------------------------------------
              Role badge
          ---------------------------------------------- */}

          <div className="flex items-center gap-2 mb-3">

            <span className="text-xs text-reel-500">
              Your role:
            </span>

            {isHost && (
              <span className="text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border bg-marquee/15 text-marquee border-marquee/40">
                👑 Host
              </span>
            )}

            {isModerator && (
              <span className="text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border bg-signal-teal/15 text-signal-teal border-signal-teal/40">
                🛡 Moderator
              </span>
            )}

            {isParticipant && (
              <span className="text-[11px] uppercase tracking-widest px-3 py-1 rounded-full border bg-reel-700 text-reel-400 border-reel-600">
                👤 Participant
              </span>
            )}

          </div>

          {/* ----------------------------------------------
              YouTube player
          ---------------------------------------------- */}

          <YouTubePlayer
            key={`player-${canControl}`}
            videoId={videoState.videoId}
            videoState={videoState}
            canControl={canControl}

            onPlay={() => {
              if (!canControl) {
                showToast(
                  "Only Host and Moderator can play the video."
                );
                return;
              }

              socket.emit("play");
            }}

            onPause={() => {
              if (!canControl) {
                showToast(
                  "Only Host and Moderator can pause the video."
                );
                return;
              }

              socket.emit("pause");
            }}

            onSeek={(time) => {
              if (!canControl) {
                showToast(
                  "Only Host and Moderator can seek."
                );
                return;
              }

              socket.emit("seek", {
                time,
              });
            }}

            onHeartbeat={(time) => {
              if (!canControl) return;

              socket.emit(
                "time_update",
                {
                  currentTime: time,
                }
              );
            }}
          />

          {/* ----------------------------------------------
              CUSTOM PLAYBACK CONTROLS
          ---------------------------------------------- */}

          <PlaybackControls
            videoState={videoState}
            canControl={canControl}

            onPlay={() => {
              socket.emit("play");
            }}

            onPause={() => {
              socket.emit("pause");
            }}

            onSeek={(time) => {
              socket.emit("seek", {
                time,
              });
            }}
          />

          {/* ----------------------------------------------
              Permission message
          ---------------------------------------------- */}

          {!canControl && (
            <div className="mt-3 bg-reel-900 border border-reel-700 rounded-lg px-4 py-3">

              <p className="text-reel-500 text-xs text-center">
                🔒 You are watching as a Participant.
              </p>

              <p className="text-reel-600 text-xs text-center mt-1">
                Only the Host and Moderator can control
                playback and change the video.
              </p>

            </div>
          )}

          {/* ----------------------------------------------
              Change Video
          ---------------------------------------------- */}

          {canControl ? (

            <ChangeVideoBar
              onChangeVideo={(videoId) => {

                socket.emit(
                  "change_video",
                  {
                    videoId,
                  }
                );

              }}
            />

          ) : (

            <p className="text-reel-600 text-xs mt-3">
              Only the host and moderators can change
              the video.
            </p>

          )}

        </div>

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <div className="space-y-5">

          {/* ----------------------------------------------
              Participants
          ---------------------------------------------- */}

          <ParticipantList
            participants={participants}
            you={you}

            onAssignRole={(userId, role) => {

              if (!isHost) {
                showToast(
                  "Only the Host can assign roles."
                );
                return;
              }

              socket.emit(
                "assign_role",
                {
                  userId,
                  role,
                }
              );
            }}

            onRemove={(userId) => {

              if (!isHost) {
                showToast(
                  "Only the Host can remove participants."
                );
                return;
              }

              socket.emit(
                "remove_participant",
                {
                  userId,
                }
              );
            }}

            onTransferHost={(userId) => {

              if (!isHost) {
                showToast(
                  "Only the Host can transfer host."
                );
                return;
              }

              socket.emit(
                "transfer_host",
                {
                  userId,
                }
              );
            }}
          />

          {/* ----------------------------------------------
              Chat
          ---------------------------------------------- */}

          <Chat
            messages={messages}
            you={you}
            onSend={(text) => {

              socket.emit(
                "chat_message",
                {
                  text,
                }
              );

            }}
          />

        </div>
      </div>

      {/* ==================================================
          TOAST
      ================================================== */}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-reel-800 border border-reel-600 text-reel-200 text-sm px-4 py-2 rounded-full shadow-xl z-50">
          {toast}
        </div>
      )}

      {/* ==================================================
          PARTICIPANT WATCHING LABEL
      ================================================== */}

      {!isHost &&
        !isModerator &&
        joined && (

          <div className="fixed top-4 right-4 text-[11px] text-reel-600 hidden sm:block">
            Watching as {you?.username}
          </div>

        )}

    </div>
  );
}