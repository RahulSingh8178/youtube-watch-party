const express = require("express");
const { customAlphabet } = require("nanoid");
const roomManager = require("../classes/RoomManager");

const router = express.Router();

const generateCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  6
);

// Create new room
router.post("/", (req, res) => {
  let code;

  do {
    code = generateCode();
  } while (roomManager.roomExists(code));

  // Actually create the room
  roomManager.getOrCreateRoom(code);

  res.status(201).json({
    roomId: code,
  });
});

// Check room
router.get("/:roomId", (req, res) => {
  const room = roomManager.getRoom(
    req.params.roomId.toUpperCase()
  );

  if (!room) {
    return res.json({
      exists: false,
    });
  }

  res.json({
    exists: true,
    participantCount: room.size,
  });
});

module.exports = router;