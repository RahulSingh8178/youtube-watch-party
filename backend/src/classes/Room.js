const { ROLES } = require("./Participant");

const VALID_ASSIGNABLE_ROLES = new Set([ROLES.MODERATOR, ROLES.PARTICIPANT]);

class Room {
  constructor(roomId) {
    this.roomId = roomId;
    /** @type {Map<string, import('./Participant').Participant>} keyed by participant.id */
    this.participants = new Map();
    this.videoState = {
      videoId: "Rh1kt0Tmz-M",
      playState: "paused", // 'playing' | 'paused'
      currentTime: 0,
      updatedAt: Date.now(),
    };
    this.chatHistory = []; // capped list of recent chat messages
    this.createdAt = Date.now();
  }

  // ---- Participant management -------------------------------------------------

  addParticipant(participant) {
    this.participants.set(participant.id, participant);
    return participant;
  }

  removeParticipant(participantId) {
    return this.participants.delete(participantId);
  }

  getParticipant(participantId) {
    return this.participants.get(participantId);
  }

  findBySocketId(socketId) {
    for (const p of this.participants.values()) {
      if (p.socketId === socketId) return p;
    }
    return null;
  }

  get size() {
    return this.participants.size;
  }

  isEmpty() {
    return this.participants.size === 0;
  }

  hasHost() {
    return [...this.participants.values()].some((p) => p.isHost());
  }

  getHost() {
    return [...this.participants.values()].find((p) => p.isHost()) || null;
  }

  listPublic() {
    return [...this.participants.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => p.toPublic());
  }

  // ---- Role / permission logic --------------------------------------------------

  canControlPlayback(participantId) {
    const p = this.getParticipant(participantId);
    return !!p && p.canControlPlayback();
  }

  canManageRoles(participantId) {
    const p = this.getParticipant(participantId);
    return !!p && p.isHost();
  }

  /**
   * Host assigns a role to another participant.
   * Throws on invalid input so the socket layer can turn it into an error event.
   */
  assignRole(actingParticipantId, targetParticipantId, newRole) {
    if (!this.canManageRoles(actingParticipantId)) {
      throw new Error("Only the host can assign roles.");
    }
    if (!VALID_ASSIGNABLE_ROLES.has(newRole)) {
      throw new Error(`Cannot assign role "${newRole}".`);
    }
    const target = this.getParticipant(targetParticipantId);
    if (!target) throw new Error("Participant not found.");
    if (target.isHost()) throw new Error("Cannot change the host's role directly.");

    target.role = newRole;
    return target;
  }

  removeParticipantByHost(actingParticipantId, targetParticipantId) {
    if (!this.canManageRoles(actingParticipantId)) {
      throw new Error("Only the host can remove participants.");
    }
    const target = this.getParticipant(targetParticipantId);
    if (!target) throw new Error("Participant not found.");
    if (target.isHost()) throw new Error("Host cannot remove themselves.");

    this.removeParticipant(targetParticipantId);
    return target;
  }

  transferHost(actingParticipantId, targetParticipantId) {
    if (!this.canManageRoles(actingParticipantId)) {
      throw new Error("Only the host can transfer the host role.");
    }
    const current = this.getParticipant(actingParticipantId);
    const target = this.getParticipant(targetParticipantId);
    if (!target) throw new Error("Participant not found.");
    if (target.id === current.id) throw new Error("Already the host.");

    current.role = ROLES.MODERATOR;
    target.role = ROLES.HOST;
    return target;
  }

  /**
   * If the host disconnects/leaves, promote the longest-tenured remaining
   * participant (preferring an existing moderator) so the room isn't stuck
   * with no one able to control playback.
   */
  promoteNextHost() {
    if (this.isEmpty()) return null;
    const remaining = [...this.participants.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    const nextHost = remaining.find((p) => p.role === ROLES.MODERATOR) || remaining[0];
    nextHost.role = ROLES.HOST;
    return nextHost;
  }

  // ---- Video / playback state ----------------------------------------------------

  updateVideoState(patch) {
    this.videoState = { ...this.videoState, ...patch, updatedAt: Date.now() };
    return this.videoState;
  }

  // ---- Chat -------------------------------------------------------------------------

  addChatMessage(message) {
    this.chatHistory.push(message);
    if (this.chatHistory.length > 100) this.chatHistory.shift();
    return message;
  }
}

module.exports = { Room, VALID_ASSIGNABLE_ROLES };
