import "dotenv/config"
import cors from "cors"
import express from "express"
import { createServer } from "http"
import { initializeCollaborationSocket } from "./sockets/collaboration.socket.js"
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
  res.status(200).json({
    success: true,
    message: "SyncScript backend is healthy",
  })
})

app.use("/api/rooms", roomRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

initializeCollaborationSocket(httpServer, clientUrl)

httpServer.listen(port, () => {
  console.log(`SyncScript backend is running on port ${port}`)
})

export { app, httpServer }
 