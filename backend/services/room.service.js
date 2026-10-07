import { v4 as uuidv4 } from "uuid"

// Temporary Day 1 storage. This will be replaced by PostgreSQL later.
const rooms = new Map()

export function createRoom() {
  const room = {
    roomId: uuidv4(),
    createdAt: new Date().toISOString(),
  }

  rooms.set(room.roomId, room)
  return room
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null
}

export function deleteRoom(roomId) {
  return rooms.delete(roomId)
}
