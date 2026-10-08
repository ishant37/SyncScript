import "dotenv/config"
import cors from "cors"
import express from "express"
import { createServer } from "http"
import { fileURLToPath } from "url"
import { connectDatabase, isDatabaseConnected } from "./config/db.js"
import { initializeCollaborationSocket } from "./sockets/collaboration.socket.js"
import authRoutes from "./routes/auth.routes.js"
import roomRoutes from "./routes/room.routes.js"
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js"

const app = express()
const httpServer = createServer(app)
const port = Number(process.env.PORT) || 3000
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"

app.use(cors({ origin: clientUrl }))
app.use(express.json())


app.use(express.static("public"))

app.get("/health", (req, res) => {
  const database = isDatabaseConnected() ? "connected" : "disconnected"

  if (database === "disconnected") {
    return res.status(503).json({
      success: false,
      message: "SyncScript backend is unhealthy",
      database,
    })
  }

  res.status(200).json({
    success: true,
    message: "SyncScript backend is healthy",
    database,
  })
})

app.use("/api/rooms", roomRoutes)
app.use("/api/auth", authRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

initializeCollaborationSocket(httpServer, clientUrl)

export async function startServer() {
  await connectDatabase()

  return httpServer.listen(port, () => {
    console.log(`SyncScript backend is running on port ${port}`)
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error("Backend startup failed", error)
    process.exitCode = 1
  })
}

export { app, httpServer }
 