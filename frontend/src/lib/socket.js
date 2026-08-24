import { io } from "socket.io-client";

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://youtube-watch-party-h29v.onrender.com";
// autoConnect: false - each page decides when to connect/disconnect so we
// don't hold a socket open while the user is just on the home screen.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});

export { SOCKET_URL };
