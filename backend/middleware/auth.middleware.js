import { verifyToken } from "../services/auth.service.js"

export function authMiddleware(req, res, next) {
  const authorization = req.get("Authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    })
  }

  try {
    const decoded = verifyToken(authorization.slice(7))

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      throw new Error("Invalid token payload")
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    }
    return next()
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
}
