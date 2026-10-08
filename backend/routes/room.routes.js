import { Router } from "express"
import {
  createRoom,
  deleteRoom,
  getRoom,
} from "../controllers/room.controller.js"
import { validateRoomId } from "../middleware/validate.middleware.js"
import { authMiddleware } from "../middleware/auth.middleware.js"

const router = Router()

router.use(authMiddleware)
router.post("/", createRoom)
router.get("/:roomId", validateRoomId, getRoom)
router.delete("/:roomId", validateRoomId, deleteRoom)

export default router
