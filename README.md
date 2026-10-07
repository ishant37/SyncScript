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
Room Service
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
cp .env.example .env
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, create a room, and share its `/room/:roomId` URL.

## Important Day 1 limitation

Room information currently uses an in-memory JavaScript `Map`. It is temporary and will be replaced with PostgreSQL in a later roadmap day. Restarting the backend clears all rooms.
