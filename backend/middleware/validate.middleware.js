const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/
const USER_ID_PATTERN = /^[a-f\d]{24}$/i

export function validateRoomId(req, res, next) {
  const { roomId } = req.params

  if (typeof roomId !== "string" || !ROOM_ID_PATTERN.test(roomId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid room ID",
    })
  }

  return next()
}

export function validateUserId(req, res, next) {
  if (
    typeof req.params.userId !== "string" ||
    !USER_ID_PATTERN.test(req.params.userId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    })
  }

  return next()
}
