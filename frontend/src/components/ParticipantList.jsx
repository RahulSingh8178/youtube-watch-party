const ROLE_STYLES = {
  host: "bg-marquee/15 text-marquee border-marquee/40",
  moderator: "bg-signal-teal/15 text-signal-teal border-signal-teal/40",
  participant: "bg-reel-700 text-reel-400 border-reel-600",
};

const ROLE_LABEL = {
  host: "Host",
  moderator: "Moderator",
  participant: "Viewer",
};

export default function ParticipantList({ participants, you, onAssignRole, onRemove, onTransferHost }) {
  const isHost = you?.role === "host";

  return (
    <div className="bg-reel-900 border border-reel-700 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl tracking-wide text-reel-200">In the room</h2>
        <span className="text-xs text-reel-400">{participants.length} watching</span>
      </div>

      <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {participants.map((p) => {
          const isSelf = p.id === you?.id;
          return (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 bg-reel-800 border border-reel-700 rounded-lg px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-reel-200 truncate">
                  {p.username}
                  {isSelf && <span className="text-reel-600"> (you)</span>}
                </p>
                <span
                  className={`inline-block mt-1 text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 ${ROLE_STYLES[p.role]}`}
                >
                  {ROLE_LABEL[p.role]}
                </span>
              </div>

              {isHost && !isSelf && (
                <div className="flex items-center gap-1 shrink-0">
                  {p.role !== "moderator" ? (
                    <button
                      title="Promote to Moderator"
                      onClick={() => onAssignRole(p.id, "moderator")}
                      className="text-[11px] px-2 py-1 rounded-md bg-reel-700 hover:bg-signal-teal/20 hover:text-signal-teal transition text-reel-400"
                    >
                      ↑ Mod
                    </button>
                  ) : (
                    <button
                      title="Demote to Viewer"
                      onClick={() => onAssignRole(p.id, "participant")}
                      className="text-[11px] px-2 py-1 rounded-md bg-reel-700 hover:bg-reel-600 transition text-reel-400"
                    >
                      ↓ Viewer
                    </button>
                  )}
                  <button
                    title="Make Host"
                    onClick={() => onTransferHost(p.id)}
                    className="text-[11px] px-2 py-1 rounded-md bg-reel-700 hover:bg-marquee/20 hover:text-marquee transition text-reel-400"
                  >
                    Host
                  </button>
                  <button
                    title="Remove from room"
                    onClick={() => onRemove(p.id)}
                    className="text-[11px] px-2 py-1 rounded-md bg-reel-700 hover:bg-signal-rose/20 hover:text-signal-rose transition text-reel-400"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
