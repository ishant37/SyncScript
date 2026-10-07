import { Server } from "socket.io"
import { YSocketIO } from "y-socket.io/dist/server"

export function initializeCollaborationSocket(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
    },
  })

  // YSocketIO maps each client room name to its own Yjs collaborative document.
  const ySocketIO = new YSocketIO(io)
  ySocketIO.initialize()

  return io
}
