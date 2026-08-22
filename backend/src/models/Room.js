const mongoose = require("mongoose");

/**
 * Persisted room metadata only - NOT the live/real-time state.
 * Live state (who's connected, current socket ids, etc.) always lives in
 * the in-memory RoomManager because it's ephemeral by nature. This model
 * just lets a room "exist" across server restarts and stores the last
 * known video so a room can be resumed.
 */
const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    hostUsername: { type: String, required: true },
    lastVideoId: { type: String, default: null },
    lastCurrentTime: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Room", roomSchema);
