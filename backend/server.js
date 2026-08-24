require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const { connectDB } = require("./src/config/db");
const roomsRouter = require("./src/routes/rooms");
const { initSocket } = require("./src/socket");
const roomManager = require("./src/classes/RoomManager");

const PORT = process.env.PORT || 4000;

// Hardcoded allowed origins to fix CORS permanently
const CLIENT_ORIGINS = [
  "https://youtubewatchedparty.vercel.app",
  "http://localhost:5173",
  ...(process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim()) : [])
];

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ...roomManager.stats() });
});
app.use("/api/rooms", roomsRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSocket(io);

async function start() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`[server] Watch Party backend listening on port ${PORT}`);
    console.log(`[server] Allowed client origins: ${CLIENT_ORIGINS.join(", ")}`);
  });
}

start();