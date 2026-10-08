import { v4 as uuidv4 } from "uuid"
import Room from "../models/room.model.js"

export async function createRoom(name = "Untitled Room") {
  return Room.create({
    roomId: uuidv4(),
    name,
  })
}

export async function getRoom(roomId) {
  return Room.findOne({ roomId }).lean()
}

export async function deleteRoom(roomId) {
  const result = await Room.deleteOne({ roomId })
  return result.deletedCount === 1
}

export async function roomExists(roomId) {
  return Boolean(await Room.exists({ roomId }))
}
