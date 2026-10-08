# SyncScript

Real-time collaborative code editor built with React, Monaco Editor, Node.js, Express, Socket.IO, and Yjs.

## Features

- Real-time collaborative editing
- JWT authentication
- Bcrypt password hashing
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

## Authentication

SyncScript uses JWT-based authentication:

```text
Registration:
Client -> Express -> bcrypt -> MongoDB

Login:
Client -> Express -> bcrypt verification -> JWT

Protected API:
Client -> Bearer token -> auth middleware -> Controller

WebSocket:
Client -> Socket.IO + JWT -> Socket authentication
```

Authentication endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Room creation, lookup, and deletion require a valid bearer token. Room ownership is derived from the authenticated user on the server; clients cannot choose another owner. Detailed room permissions and roles are planned for Day 4.

For this learning project, the frontend stores the JWT in `localStorage`. Production applications should evaluate secure, HTTP-only cookie-based sessions or another storage strategy based on their threat model. Logout removes the local token and disconnects the current collaboration view, but JWT revocation is not implemented yet.

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
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
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
