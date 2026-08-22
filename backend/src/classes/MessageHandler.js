const { Participant, ROLES } = require("./Participant");
const RoomModel = require("../models/Room");

/**
 * MessageHandler owns the logic for a single connected socket: validating
 * incoming events against the room's role rules, mutating room state, and
 * broadcasting the result. Keeping this separate from the raw socket.io
 * wiring (see socket/index.js) makes the permission logic unit-testable
 * and keeps socket/index.js a thin transport layer.
 */
class MessageHandler {
  constructor({ io, socket, roomManager }) {
    this.io = io;
    this.socket = socket;
    this.roomManager = roomManager;
    /** The participant this socket currently represents, once joined. */
    this.participantId = null;
    this.roomId = null;
  }

  // ---- helpers -------------------------------------------------------------------

  currentRoom() {
    return this.roomId ? this.roomManager.getRoom(this.roomId) : null;
  }

  currentParticipant() {
    const room = this.currentRoom();
    return room && this.participantId ? room.getParticipant(this.participantId) : null;
  }

  emitError(message) {
    this.socket.emit("action_error", { message });
  }

  broadcastParticipants(room, event = "role_assigned") {
    this.io.to(room.roomId).emit(event, { participants: room.listPublic() });
  }

  // ---- event handlers --------------------------------------------------------------

  async handleJoinRoom({ roomId, username, participantId }) {
    if (!roomId || !username || !username.trim()) {
      return this.emitError("roomId and username are required to join a room.");
    }
    roomId = roomId.trim().toUpperCase();

    const room = this.roomManager.getOrCreateRoom(roomId);
    const isFirstParticipant = room.isEmpty();
    const id = participantId || this.socket.id;

    const participant = new Participant({
      id,
      socketId: this.socket.id,
      username: username.trim().slice(0, 30),
      role: isFirstParticipant ? ROLES.HOST : ROLES.PARTICIPANT,
    });

    room.addParticipant(participant);
    this.participantId = participant.id;
    this.roomId = roomId;
    this.socket.join(roomId);

    // Persist room metadata (best-effort; app works fine without Mongo).
    if (isFirstParticipant) {
      RoomModel.updateOne(
        { roomId },
        { $setOnInsert: { roomId, hostUsername: participant.username } },
        { upsert: true }
      ).catch(() => {});
    } else {
      RoomModel.updateOne({ roomId }, { $set: { lastActiveAt: new Date() } }).catch(() => {});
    }

    // Tell the joining client everything they need to render the room.
    this.socket.emit("room_joined", {
      roomId,
      you: participant.toPublic(),
      participants: room.listPublic(),
      videoState: room.videoState,
      chatHistory: room.chatHistory,
    });

    // Tell everyone else someone new arrived.
    this.socket.to(roomId).emit("user_joined", {
      username: participant.username,
      userId: participant.id,
      role: participant.role,
      participants: room.listPublic(),
    });
  }

  handleLeaveRoom() {
    this._removeSelfFromRoom("user_left");
    this.socket.leave(this.roomId || "");
    this.roomId = null;
    this.participantId = null;
  }

  handleDisconnect() {
    this._removeSelfFromRoom("user_left");
  }

  _removeSelfFromRoom(eventName) {
    const room = this.currentRoom();
    const participant = this.currentParticipant();
    if (!room || !participant) return;

    const wasHost = participant.isHost();
    room.removeParticipant(participant.id);

    if (wasHost && !room.isEmpty()) {
      const newHost = room.promoteNextHost();
      this.io.to(room.roomId).emit("host_changed", {
        newHostId: newHost.id,
        newHostUsername: newHost.username,
        participants: room.listPublic(),
      });
    }

    if (room.isEmpty()) {
      this.roomManager.deleteRoom(room.roomId);
    } else {
      this.io.to(room.roomId).emit(eventName, {
        username: participant.username,
        userId: participant.id,
        participants: room.listPublic(),
      });
    }
  }

  handlePlay() {
    this._handlePlaybackChange({ playState: "playing" }, "play");
  }

  handlePause() {
    this._handlePlaybackChange({ playState: "paused" }, "pause");
  }

  handleSeek({ time }) {
    if (typeof time !== "number" || time < 0) return this.emitError("Invalid seek time.");
    this._handlePlaybackChange({ currentTime: time }, "seek");
  }

  handleChangeVideo({ videoId }) {
    if (!videoId || typeof videoId !== "string") return this.emitError("Invalid videoId.");
    this._handlePlaybackChange(
      { videoId, currentTime: 0, playState: "playing" },
      "change_video"
    );
  }

  handleTimeUpdate({ currentTime }) {
    // Lightweight drift-correction heartbeat, sent periodically by whoever
    // is currently driving playback. Does not re-broadcast the playState.
    if (typeof currentTime !== "number") return;
    this._handlePlaybackChange({ currentTime }, "time_update", /* silent */ true);
  }

  _handlePlaybackChange(patch, sourceEvent, silent = false) {
    const room = this.currentRoom();
    const participant = this.currentParticipant();
    if (!room || !participant) return this.emitError("You are not in a room.");

    if (!room.canControlPlayback(participant.id)) {
      return this.emitError(`Your role ("${participant.role}") cannot control playback.`);
    }

    const videoState = room.updateVideoState(patch);

    if (silent) {
      // Drift correction: send to everyone except the sender, no need to echo.
      this.socket.to(room.roomId).emit("sync_state", { ...videoState, source: sourceEvent });
    } else {
      this.io.to(room.roomId).emit("sync_state", { ...videoState, source: sourceEvent });
    }
  }

  handleAssignRole({ userId, role }) {
    const room = this.currentRoom();
    const participant = this.currentParticipant();
    if (!room || !participant) return this.emitError("You are not in a room.");

    try {
      room.assignRole(participant.id, userId, role);
      this.broadcastParticipants(room, "role_assigned");
    } catch (err) {
      this.emitError(err.message);
    }
  }

  handleRemoveParticipant({ userId }) {
    const room = this.currentRoom();
    const participant = this.currentParticipant();
    if (!room || !participant) return this.emitError("You are not in a room.");

    try {
      const removed = room.removeParticipantByHost(participant.id, userId);
      this.io.to(room.roomId).emit("participant_removed", {
        userId: removed.id,
        participants: room.listPublic(),
      });
      // Tell the removed user's specific socket so their client can boot them out.
      this.io.to(removed.socketId).emit("you_were_removed");
      const removedSocket = this.io.sockets.sockets.get(removed.socketId);
      if (removedSocket) removedSocket.leave(room.roomId);
    } catch (err) {
      this.emitError(err.message);
    }
  }

  handleTransferHost({ userId }) {
    const room = this.currentRoom();
    const participant = this.currentParticipant();
    if (!room || !participant) return this.emitError("You are not in a room.");

    try {
      const newHost = room.transferHost(participant.id, userId);
      this.io.to(room.roomId).emit("host_changed", {
        newHostId: newHost.id,
        newHostUsername: newHost.username,
        participants: room.listPublic(),
      });
    } catch (err) {
      this.emitError(err.message);
    }
  }

  handleChatMessage({ text }) {
    const room = this.currentRoom();
    const participant = this.currentParticipant();
    if (!room || !participant) return this.emitError("You are not in a room.");
    const trimmed = (text || "").trim().slice(0, 500);
    if (!trimmed) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: participant.id,
      username: participant.username,
      text: trimmed,
      sentAt: Date.now(),
    };
    room.addChatMessage(message);
    this.io.to(room.roomId).emit("chat_message", message);
  }
}

module.exports = MessageHandler;
