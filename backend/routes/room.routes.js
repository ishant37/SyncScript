import { Router } from "express"
import {
  createRoom,
  deleteRoom,
  getRoom,
} from "../controllers/room.controller.js"
import { validateRoomId } from "../middleware/validate.middleware.js"

const router = Router()

router.post("/", createRoom)
router.get("/:roomId", validateRoomId, getRoom)
router.delete("/:roomId", validateRoomId, deleteRoom)

export default router
