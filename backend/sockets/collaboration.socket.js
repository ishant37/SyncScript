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

  io.on("connection", (socket) => {
    let videoRoom = null

    socket.on("video:join", async ({ roomId } = {}) => {
      try {
        const room = await Room.findOne({ roomId }).select("_id").lean()
        const isMember =
          room &&
          (await RoomMember.exists({
            room: room._id,
            user: socket.user.userId,
          }))

        if (!isMember) {
          socket.emit("video:error", { message: "You do not have access to this room." })
          return
        }

        const nextVideoRoom = `video:${roomId}`
        const existingPeers = Array.from(
          io.sockets.adapter.rooms.get(nextVideoRoom) || [],
        ).filter((socketId) => socketId !== socket.id)

        if (existingPeers.length > 1) {
          socket.emit("video:error", {
            message: "This room already has an active 1:1 video call.",
          })
          return
        }

        videoRoom = nextVideoRoom
        socket.join(videoRoom)
        socket.emit("video:peers", existingPeers)
        socket.to(videoRoom).emit("video:peer-joined", {
          peerId: socket.id,
          userId: socket.user.userId,
        })
      } catch (error) {
        console.error("Video room join failed", error.message)
        socket.emit("video:error", { message: "Could not join the video call." })
      }
    })

    socket.on("video:signal", ({ peerId, signal } = {}) => {
      if (!videoRoom || !peerId || !signal) return
      io.to(peerId).emit("video:signal", {
        peerId: socket.id,
        signal,
      })
    })

    socket.on("video:recording-consent", ({ consented } = {}) => {
      if (!videoRoom) return
      socket.to(videoRoom).emit("video:recording-consent", {
        peerId: socket.id,
        consented: Boolean(consented),
      })
    })

    socket.on("disconnect", () => {
      if (videoRoom) {
        socket.to(videoRoom).emit("video:peer-left", { peerId: socket.id })
      }
    })
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
