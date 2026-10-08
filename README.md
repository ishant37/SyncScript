# SyncScript

Real-time collaborative code editor built with React, Monaco Editor, Node.js, Express, Socket.IO, and Yjs.

## Features

- Real-time collaborative editing
- Dynamic rooms
- Monaco code editor
- Multiple users
- Presence
- WebSocket communication
- Yjs synchronization

## Architecture

```text
React + Monaco
      |
      | HTTP
      v
Express REST API
      |
      v
Room Controller
      |
      v
Room Service -> Mongoose -> MongoDB
      |
      | WebSocket
      v
Socket.IO
      |
      v
Yjs / y-socket.io
      |
      v
Collaborative Room
```

## API

```text
POST   /api/rooms
GET    /api/rooms/:roomId
DELETE /api/rooms/:roomId
GET    /health
```

## Run locally

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env` from `.env.example`:

```env
PORT=3000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/syncscript
```

Start MongoDB locally before starting the backend. Alternatively, use MongoDB Atlas and set `MONGO_URI` to the Atlas connection string. The backend connects to MongoDB before it begins accepting HTTP requests.

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, create a room, and share its `/room/:roomId` URL.

## MongoDB persistence

SyncScript uses MongoDB for persistent application data.

- **Yjs + Socket.IO:** real-time collaboration
- **MongoDB:** persistent room metadata (`roomId`, `name`, `createdAt`, and `updatedAt`)

Room IDs are indexed uniquely because they are used for frequent collaborative-room lookups. Editor content is intentionally not stored in MongoDB; Yjs remains responsible for real-time editing.
