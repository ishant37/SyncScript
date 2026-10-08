import * as roomService from "../services/room.service.js"

export async function createRoom(req, res) {
  const requestedName = req.body?.name

  if (
    requestedName !== undefined &&
    (typeof requestedName !== "string" ||
      requestedName.trim().length < 1 ||
      requestedName.trim().length > 100)
  ) {
    return res.status(400).json({
      success: false,
      message: "Room name must be a string between 1 and 100 characters",
    })
  }

  const room = await roomService.createRoom(
    requestedName === undefined ? undefined : requestedName.trim(),
  )

  return res.status(201).json({
    success: true,
    room,
  })
}

export async function getRoom(req, res) {
  const room = await roomService.getRoom(req.params.roomId)

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  return res.status(200).json({ message: "Room found", success: true, room })
}

export async function deleteRoom(req, res) {
  const deleted = await roomService.deleteRoom(req.params.roomId)

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  return res.status(200).json({
    success: true,
    message: "Room deleted successfully",
  })
}
