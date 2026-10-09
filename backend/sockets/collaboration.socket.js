import { Server } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import { YSocketIO } from "y-socket.io/dist/server"
import { verifyToken } from "../services/auth.service.js"
import RoomMember from "../models/room-member.model.js"
import Room from "../models/room.model.js"

async function authenticateYjsHandshake(handshake) {
  try {
    const decoded = verifyToken(handshake.auth?.token)
    const namespaceRoomId = handshake.auth?.roomId

    if (!decoded?.userId || !namespaceRoomId) {
      return false
    }

    handshake.userId = decoded.userId

    const room = await Room.findOne({ roomId: namespaceRoomId })
      .select("_id")
      .lean()

    if (!room) {
      return false
    }

    return Boolean(
      await RoomMember.exists({
        room: room._id,
        user: decoded.userId,
      }),
    )
  } catch {
    return false
  }
}

export function initializeCollaborationSocket(
  httpServer,
  clientUrl,
  redisClients = null,
) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
    },
  })

  if (redisClients) {
    io.adapter(createAdapter(redisClients.pubClient, redisClients.subClient))
  }

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      const decoded = verifyToken(token)

      if (!decoded || typeof decoded !== "object" || !decoded.userId) {
        throw new Error("Invalid token payload")
      }

      socket.user = {
        userId: decoded.userId,
        email: decoded.email,
      }
      return next()
    } catch {
      return next(new Error("Authentication required"))
    }
  })

  // YSocketIO maps each client room name to its own Yjs collaborative document.
  const ySocketIO = new YSocketIO(io, {
    authenticate: authenticateYjsHandshake,
  })
  ySocketIO.initialize()

  io.of(/^\/yjs\|.*$/).on("connection", (socket) => {
    const membershipCheck = setInterval(() => {
      checkYjsMembership(socket).catch((error) => {
        console.error("Yjs membership check failed", error.message)
      })
    }, Number(process.env.COLLABORATION_AUTH_CHECK_INTERVAL_MS) || 5000)

    socket.once("disconnect", () => clearInterval(membershipCheck))
  })

  return io
}

async function checkYjsMembership(socket) {
  const room = await Room.findOne({
    roomId: socket.handshake.auth?.roomId,
  })
    .select("_id")
    .lean()

  const isMember =
    room &&
    (await RoomMember.exists({
      room: room._id,
      user: socket.handshake.userId,
    }))

  if (!isMember) {
    socket.disconnect(true)
  }
}
