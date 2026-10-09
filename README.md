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
      +--> Redis Pub/Sub + Socket.IO Redis adapter
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
POST   /api/rooms/:roomId/join
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

Room creation, lookup, joining, and deletion require a valid bearer token. Room ownership is derived from the authenticated user on the server; clients cannot choose another owner.

Creating a room returns its generated Room ID and secure passcode once:

```json
{
  "room": {
    "roomId": "generated-room-id"
  },
  "passcode": "one-time-shareable-passcode"
}
```

The backend stores only a bcrypt hash of the passcode. Participants must send
the Room ID and passcode to `POST /api/rooms/:roomId/join`; a successful join
creates an `EDITOR` membership unless the user is already a member. Guessing a
Room ID or opening its URL does not grant access.

## Room authorization (Day 4)

Room membership is stored separately in MongoDB with one of three roles:

```text
OWNER  - manage members and delete the room
EDITOR - access the room and edit collaboratively
VIEWER - access the room without editor permissions
```

The room owner can manage members using:

```text
GET    /api/rooms/:roomId/members
POST   /api/rooms/:roomId/members
PATCH  /api/rooms/:roomId/members/:userId
DELETE /api/rooms/:roomId/members/:userId
```

Add or update members with a JSON body such as:

```json
{
 "email": "editor@example.com",
 "role": "EDITOR"
}
```

Only room members can access a room or its Yjs Socket.IO namespace. Only the owner can manage membership or delete the room. The owner cannot be demoted or removed.

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
REDIS_ENABLED=false
REDIS_REQUIRED=false
REDIS_URL=redis://127.0.0.1:6379
```

Start MongoDB locally before starting the backend. Alternatively, use MongoDB Atlas and set `MONGO_URI` to the Atlas connection string. The backend connects to MongoDB before it begins accepting HTTP requests.

For local MongoDB and Redis services, run:

```bash
docker compose up -d mongodb redis
```

Set `REDIS_ENABLED=true` to enable the Socket.IO Redis adapter. Set
`REDIS_REQUIRED=true` for a multi-instance deployment so the backend refuses to
start if Redis cannot be reached. With Redis disabled, the backend explicitly
runs in single-instance mode.

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
- **Redis Pub/Sub:** short-lived cross-instance Socket.IO event delivery

Room IDs are indexed uniquely because they are used for frequent collaborative-room lookups. Editor content is intentionally not stored in MongoDB; Yjs remains responsible for real-time editing.

## Redis and multi-instance Socket.IO

Redis is used only for Socket.IO adapter Pub/Sub. It allows events emitted by
one backend instance to reach clients connected to another instance. Redis is
not the source of truth for users, rooms, roles, or editor history.

Run two backend instances against the same MongoDB and Redis. In PowerShell,
use separate terminals:

```powershell
$env:REDIS_ENABLED="true"
$env:REDIS_REQUIRED="true"
$env:REDIS_URL="redis://127.0.0.1:6379"
$env:PORT="3000"
npm start
```

Use the same variables with `PORT="3001"` in the second terminal. Put a load
balancer or sticky-session-aware reverse proxy in front of the instances for
browser traffic. Verify that two clients in the same room, connected to
different backend ports, receive collaboration and presence updates. A Redis
`PUBLISH` test alone does not prove multi-instance Socket.IO behavior.

The `/health` response reports MongoDB and Redis status. In optional Redis mode,
a connection failure falls back explicitly to single-instance mode. In required
mode, Redis failure makes health unhealthy and prevents startup when the initial
connection cannot be established.

The Socket.IO Redis adapter distributes Socket.IO events, but it does not
persist Yjs documents. The current `y-socket.io` integration keeps document
state in the individual server process. Reliable multi-instance Yjs editing
requires a shared Yjs persistence/coordination design; Redis Pub/Sub alone is
not a durable Yjs document store. This Day 5 change preserves the existing Yjs
transport and authorization without claiming that Redis solves document
persistence.

Yjs membership is rechecked periodically (5 seconds by default), so a member
removed from MongoDB is disconnected from existing Yjs connections shortly
after revocation. Set `COLLABORATION_AUTH_CHECK_INTERVAL_MS` to tune this
interval.
