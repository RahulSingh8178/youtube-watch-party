import { useEffect, useRef, useState } from "react";

export default function Chat({ messages, you, onSend }) {
  const [text, setText] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  function handleSubmit(e) {
    e.preventDefault();

    const message = text.trim();

    if (!message) return;

    onSend(message);
    setText("");
  }

  return (
    <div className="bg-reel-900 border border-reel-700 rounded-2xl p-4 sm:p-5 flex flex-col h-80 shadow-lg">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl tracking-wide text-reel-200">
            Chat
          </h2>

          <p className="text-[11px] text-reel-500 mt-0.5">
            Talk with everyone in the room
          </p>
        </div>

        <span className="text-[10px] uppercase tracking-widest text-reel-500">
          {messages.length}{" "}
          {messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-3xl mb-2">💬</div>

            <p className="text-reel-500 text-sm">
              No messages yet
            </p>

            <p className="text-reel-700 text-xs mt-1">
              Start the conversation 👋
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isYou = m.userId === you?.id;

          return (
            <div
              key={m.id}
              className={`flex ${
                isYou ? "justify-end" : "justify-start"
              }`}
            >
              <div className="max-w-[88%]">

                {/* User name + time */}
                <div
                  className={`flex items-center gap-2 mb-1.5 px-1 ${
                    isYou ? "justify-end" : "justify-start"
                  }`}
                >
                  <span
                    className={`text-xs font-bold tracking-wide ${
                      isYou
                        ? "text-marquee"
                        : "text-signal-teal"
                    }`}
                  >
                    {isYou ? "You" : m.username}
                  </span>

                  {m.sentAt && (
                    <span className="text-[9px] text-reel-600">
                      {new Date(m.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>

                {/* Message Card */}
                <div
                  className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed break-words border shadow-sm ${
                    isYou
                      ? "bg-marquee/10 border-marquee/40 text-reel-200 rounded-tr-sm"
                      : "bg-reel-800/80 border-reel-600 text-reel-200 rounded-tl-sm"
                  }`}
                >
                  {m.text}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 pt-3 border-t border-reel-800"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1 min-w-0 bg-reel-800 border border-reel-600 rounded-xl px-3 py-2.5 text-sm text-reel-200 placeholder:text-reel-600 focus:outline-none focus:border-signal-violet focus:ring-1 focus:ring-signal-violet/30 transition"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="px-4 py-2.5 rounded-xl bg-signal-violet text-reel-950 text-sm font-bold hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}