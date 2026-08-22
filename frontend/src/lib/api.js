import { SOCKET_URL } from "./socket.js";

export async function createRoom() {
  const res = await fetch(`${SOCKET_URL}/api/rooms`, { method: "POST" });
  if (!res.ok) throw new Error("Could not create a room right now.");
  return res.json(); // { roomId }
}

export async function checkRoomExists(roomId) {
  const res = await fetch(`${SOCKET_URL}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error("Could not reach the server.");
  return res.json(); // { exists, participantCount? }
}
