import "dotenv/config"
import cors from "cors"
import express from "express"
import { createServer } from "http"
import { fileURLToPath } from "url"
import { connectDatabase, isDatabaseConnected } from "./config/db.js"
import mongoose from "mongoose"
import {
  connectRedis,
  disconnectRedis,
  getRedisStatus,
} from "./config/redis.js"
import { initializeCollaborationSocket } from "./sockets/collaboration.socket.js"
import authRoutes from "./routes/auth.routes.js"
import roomRoutes from "./routes/room.routes.js"
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js"

const app = express()
const httpServer = createServer(app)
const port = Number(process.env.PORT) || 3000
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"
let socketServer

app.use(cors({ origin: clientUrl }))
app.use(express.json())


app.use(express.static("public"))

app.get("/health", (req, res) => {
  const database = isDatabaseConnected() ? "connected" : "disconnected"
  const redis = getRedisStatus()

  if (database === "disconnected" || (redis.required && !redis.connected)) {
    return res.status(503).json({
      success: false,
      message: "SyncScript backend is unhealthy",
      database,
      redis,
    })
  }

  res.status(200).json({
    success: true,
    message: "SyncScript backend is healthy",
    database,
    redis,
  })
})

app.use("/api/rooms", roomRoutes)
app.use("/api/auth", authRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

export async function startServer() {
  await connectDatabase()
  const redisClients = await connectRedis()
  socketServer = initializeCollaborationSocket(
    httpServer,
    clientUrl,
    redisClients,
  )

  return new Promise((resolve, reject) => {
    const handleListenError = (error) => {
      if (error.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use. Stop the existing backend process or set a different PORT.`,
          ),
        )
        return
      }

      reject(error)
    }

    httpServer.once("error", handleListenError)
    httpServer.listen(port, () => {
      httpServer.off("error", handleListenError)
      console.log(`SyncScript backend is running on port ${port}`)
      resolve(httpServer)
    })
  })
}

export async function shutdownServer() {
  socketServer?.close()

  if (httpServer.listening) {
    await new Promise((resolve) => httpServer.close(resolve))
  }

  await disconnectRedis()
  await mongoose.disconnect()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error("Backend startup failed", error)
    shutdownServer()
      .catch((shutdownError) => {
        console.error("Backend startup cleanup failed", shutdownError)
      })
      .finally(() => {
        process.exitCode = 1
      })
  })

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => {
      try {
        await shutdownServer()
        process.exit(0)
      } catch (error) {
        console.error("Backend shutdown failed", error)
        process.exit(1)
      }
    })
  }
}

export { app, httpServer }
 