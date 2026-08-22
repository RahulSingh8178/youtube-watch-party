const MessageHandler = require("../classes/MessageHandler");
const roomManager = require("../classes/RoomManager");

/**
 * Wires up Socket.IO events. Each connection gets its own MessageHandler
 * instance which tracks which room/participant that socket belongs to and
 * enforces role permissions before mutating room state.
 */
function initSocket(io) {
  io.on("connection", (socket) => {
    const handler = new MessageHandler({ io, socket, roomManager });

    socket.on("join_room", (payload) => handler.handleJoinRoom(payload || {}));
    socket.on("leave_room", () => handler.handleLeaveRoom());

    socket.on("play", () => handler.handlePlay());
    socket.on("pause", () => handler.handlePause());
    socket.on("seek", (payload) => handler.handleSeek(payload || {}));
    socket.on("change_video", (payload) => handler.handleChangeVideo(payload || {}));
    socket.on("time_update", (payload) => handler.handleTimeUpdate(payload || {}));

    socket.on("assign_role", (payload) => handler.handleAssignRole(payload || {}));
    socket.on("remove_participant", (payload) => handler.handleRemoveParticipant(payload || {}));
    socket.on("transfer_host", (payload) => handler.handleTransferHost(payload || {}));

    socket.on("chat_message", (payload) => handler.handleChatMessage(payload || {}));

    socket.on("disconnect", () => handler.handleDisconnect());
  });
}

module.exports = { initSocket };
