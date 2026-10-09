import * as roomService from "../services/room.service.js"

export function requireRoomAccess(...allowedRoles) {
  return async (req, res, next) => {
    const { room, membership } = await roomService.getMembership(
      req.params.roomId,
      req.user.userId,
    )

    if (!room || !membership) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this room",
      })
    }

    if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission for this action",
      })
    }

    req.room = room
    req.membership = membership
    return next()
  }
}
