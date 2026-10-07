import * as roomService from "../services/room.service.js"

export function createRoom(req, res) {
  res.status(201).json({
    success: true,
    room: roomService.createRoom(),
  })
}

export function getRoom(req, res) {
  const room = roomService.getRoom(req.params.roomId)

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  return res.status(200).json({ success: true, room })
}

export function deleteRoom(req, res) {
  const deleted = roomService.deleteRoom(req.params.roomId)

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
