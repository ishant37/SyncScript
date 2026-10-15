import { Router } from "express"
import { authMiddleware } from "../middleware/auth.middleware.js"
import { requireRole } from "../middleware/role.middleware.js"
import {
  createInterview,
  getInterview,
  joinInterview,
  listInterviews,
} from "../controllers/interview.controller.js"

const router = Router()
router.use(authMiddleware)
router.post("/", requireRole("interviewer"), createInterview)
router.get("/", listInterviews)
router.get("/:id", getInterview)
router.post("/:id/join", joinInterview)
export default router
