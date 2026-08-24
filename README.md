# 🎬 YouTube Watch Party

A real-time YouTube Watch Party application where multiple users can watch YouTube videos together in synchronized rooms.

🌐 **Live Demo:** [https://youtubewatchedparty.vercel.app](https://youtubewatchedparty.vercel.app)  
⚙️ **Backend Health Check:** [https://youtube-watch-party-h29v.onrender.com/api/health](https://youtube-watch-party-h29v.onrender.com/api/health)

---

## 🚀 Features

* **Room Management:** Create a watch party room or join using a room code.
* **Role Hierarchy:** Host, Moderator, and Participant roles with custom permissions.
* **Real-time Synchronization:** Play/Pause, Seek, and Video changing sync across all clients in real-time.
* **Interactive Chat:** Real-time chat system for participants inside the room.
* **Host Controls:** Host can assign Moderator roles, remove participants, or transfer Host privileges.
* **Database Integration:** MongoDB integration for room metadata and persistence.

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, React Router, Tailwind CSS
* **Backend:** Node.js, Express.js, Socket.IO
* **Database:** MongoDB, Mongoose
* **Video API:** YouTube IFrame Player API
* **Hosting:** Vercel (Frontend), Render (Backend)

---

## 📁 Project Structure

```text
watch-party/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── classes/
│   │   ├── models/
│   │   ├── routes/
│   │   └── socket/
│   └── server.js
└── README.md