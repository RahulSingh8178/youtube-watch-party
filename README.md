# YouTube Watch Party

A real-time YouTube Watch Party application where multiple users can
watch YouTube videos together in synchronized rooms.

## Features

- Create a watch party room
- Join room using room code
- Host and Participant roles
- Moderator role
- Play/Pause synchronization
- Seek synchronization
- Change YouTube video
- Real-time participant updates
- Host can assign Moderator role
- Host can remove participants
- Host can transfer host role
- Real-time chat
- MongoDB integration
- Socket.IO WebSocket communication

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS

### Backend
- Node.js
- Express.js
- Socket.IO

### Database
- MongoDB
- Mongoose

### Video
- YouTube IFrame Player API

## Project Structure

watch-party/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
│   └── package.json
│
├── backend/
│   ├── classes/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   └── server.js
│
└── README.md

## How It Works

1. User enters their name.
2. User creates a new room.
3. The first user automatically becomes Host.
4. Other users joining the same room become Participants.
5. Host can promote a Participant to Moderator.
6. Host and Moderator can control playback.
7. Playback actions are sent through Socket.IO.
8. Backend validates the user's role.
9. Server broadcasts the updated video state to all users.
10. All users update their YouTube player accordingly.

## Run Locally

### Install dependencies

From the project root:

npm install

Then install frontend dependencies:

cd frontend
npm install

Then install backend dependencies:

cd ../backend
npm install

### Start the application

From the root:

npm run dev

Frontend:

http://localhost:5173

Backend:

http://localhost:4000

## WebSocket Events

- join_room
- leave_room
- play
- pause
- seek
- change_video
- time_update
- assign_role
- remove_participant
- transfer_host
- chat_message
- sync_state

## Role Permissions

| Role | Play/Pause | Seek | Change Video | Assign Roles | Remove Users |
|------|------------|------|--------------|--------------|--------------|
| Host | Yes | Yes | Yes | Yes | Yes |
| Moderator | Yes | Yes | Yes | No | No |
| Participant | No | No | No | No | No |

## Database

MongoDB is used for room metadata and persistence.

## Future Improvements

- Authentication
- Persistent rooms
- Redis adapter for scaling
- Reactions
- User avatars
- Video queue
- Production deployment