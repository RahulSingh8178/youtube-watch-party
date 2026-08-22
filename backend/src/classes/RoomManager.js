const { Room } = require("./Room");

class RoomManager {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  getOrCreateRoom(roomId) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Room(roomId);
      this.rooms.set(roomId, room);
    }
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId) || null;
  }

  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  deleteRoom(roomId) {
    return this.rooms.delete(roomId);
  }

  deleteIfEmpty(roomId) {
    const room = this.rooms.get(roomId);
    if (room && room.isEmpty()) {
      this.rooms.delete(roomId);
      return true;
    }
    return false;
  }

  stats() {
    let totalParticipants = 0;
    for (const room of this.rooms.values()) totalParticipants += room.size;
    return { rooms: this.rooms.size, participants: totalParticipants };
  }
}

// Singleton - one process-wide registry of live rooms.
module.exports = new RoomManager();
