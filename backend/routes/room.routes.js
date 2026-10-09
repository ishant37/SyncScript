import { Router } from "express"
import {
  createRoom,
  deleteRoom,
  getRoom,
  joinRoom,
} from "../controllers/room.controller.js"
import {
  validateRoomId,
  validateUserId,
} from "../middleware/validate.middleware.js"
import { authMiddleware } from "../middleware/auth.middleware.js"
import { requireRoomAccess } from "../middleware/room-access.middleware.js"
import {
  addMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from "../controllers/room.controller.js"

const router = Router()

router.use(authMiddleware)
router.post("/", createRoom)
router.post("/:roomId/join", validateRoomId, joinRoom)
router.get(
  "/:roomId",
  validateRoomId,
  requireRoomAccess("OWNER", "EDITOR", "VIEWER"),
  getRoom,
)
router.delete(
  "/:roomId",
  validateRoomId,
  requireRoomAccess("OWNER"),
  deleteRoom,
)
router.get(
  "/:roomId/members",
  validateRoomId,
  requireRoomAccess("OWNER", "EDITOR", "VIEWER"),
  listMembers,
)
router.post(
  "/:roomId/members",
  validateRoomId,
  requireRoomAccess("OWNER"),
  addMember,
)
router.patch(
  "/:roomId/members/:userId",
  validateRoomId,
  validateUserId,
  requireRoomAccess("OWNER"),
  updateMemberRole,
)
router.delete(
  "/:roomId/members/:userId",
  validateRoomId,
  validateUserId,
  requireRoomAccess("OWNER"),
  removeMember,
)

export default router
