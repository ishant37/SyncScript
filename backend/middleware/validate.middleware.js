const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/

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
