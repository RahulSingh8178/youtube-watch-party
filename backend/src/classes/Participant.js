const ROLES = Object.freeze({
  HOST: "host",
  MODERATOR: "moderator",
  PARTICIPANT: "participant",
});

/** Roles allowed to control playback (play/pause/seek/change video). */
const CONTROL_ROLES = new Set([ROLES.HOST, ROLES.MODERATOR]);

class Participant {
  constructor({ id, socketId, username, role = ROLES.PARTICIPANT }) {
    this.id = id; // stable per-connection id (persists across reconnect attempts if resent by client)
    this.socketId = socketId; // current socket.io connection id
    this.username = username;
    this.role = role;
    this.joinedAt = Date.now();
  }

  canControlPlayback() {
    return CONTROL_ROLES.has(this.role);
  }

  isHost() {
    return this.role === ROLES.HOST;
  }

  /** Shape sent to clients - never leak internal fields like socketId. */
  toPublic() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      joinedAt: this.joinedAt,
    };
  }
}

module.exports = { Participant, ROLES, CONTROL_ROLES };
