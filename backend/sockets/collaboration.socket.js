import { Server } from "socket.io"
import { YSocketIO } from "y-socket.io/dist/server"
import { verifyToken } from "../services/auth.service.js"

export function initializeCollaborationSocket(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
    },
  })

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
  const ySocketIO = new YSocketIO(io)
  ySocketIO.initialize()

  return io
}
