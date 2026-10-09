import bcrypt from "bcrypt"
import { randomBytes } from "node:crypto"
import { v4 as uuidv4 } from "uuid"
import Room from "../models/room.model.js"
import RoomMember from "../models/room-member.model.js"
import User from "../models/user.model.js"

export async function createRoom(name = "Untitled Room", owner) {
  const passcode = randomBytes(9).toString("base64url")
  const passcodeHash = await bcrypt.hash(passcode, 12)
  const room = await Room.create({
    roomId: uuidv4(),
    name,
    owner,
    passcodeHash,
  })

  try {
    await RoomMember.create({
      room: room._id,
      user: owner,
      role: "OWNER",
    })
  } catch (error) {
    await Room.deleteOne({ _id: room._id })
    throw error
  }

  return { room, passcode }
}

export async function joinRoom(roomId, passcode, userId) {
  const room = await Room.findOne({ roomId }).select("+passcodeHash").lean()

  if (!room || !room.passcodeHash) {
    return { kind: "room-not-found" }
  }

  const validPasscode = await bcrypt.compare(passcode, room.passcodeHash)
  if (!validPasscode) {
    return { kind: "invalid-passcode" }
  }

  const membership = await RoomMember.findOneAndUpdate(
    { room: room._id, user: userId },
    { $setOnInsert: { role: "EDITOR" } },
    { new: true, upsert: true, runValidators: true },
  ).lean()

  delete room.passcodeHash

  return {
    kind: "success",
    room,
    role: membership.role,
  }
}

export async function getRoomForUser(roomId, userId) {
  const room = await Room.findOne({ roomId }).lean()
  if (!room) {
    return null
  }

  const membership = await RoomMember.findOne({
    room: room._id,
    user: userId,
  }).lean()

  if (!membership) {
    return null
  }

  return { room, role: membership.role }
}

export async function getMembership(roomId, userId) {
  const room = await Room.findOne({ roomId }).select("_id owner").lean()
  if (!room) {
    return { room: null, membership: null }
  }

  const membership = await RoomMember.findOne({
    room: room._id,
    user: userId,
  }).lean()

  return { room, membership }
}

export async function deleteRoom(roomId) {
  const room = await Room.findOneAndDelete({ roomId })
  if (!room) {
    return false
  }

  await RoomMember.deleteMany({ room: room._id })
  return true
}

export async function listMembers(roomId) {
  const room = await Room.findOne({ roomId }).select("_id").lean()
  if (!room) {
    return null
  }

  return RoomMember.find({ room: room._id })
    .populate("user", "username email")
    .lean()
}

export async function addMember(roomId, email, role) {
  const [room, user] = await Promise.all([
    Room.findOne({ roomId }).select("_id").lean(),
    User.findOne({ email }).select("_id username email").lean(),
  ])

  if (!room) {
    return { kind: "room-not-found" }
  }

  if (!user) {
    return { kind: "user-not-found" }
  }

  const member = await RoomMember.findOneAndUpdate(
    { room: room._id, user: user._id },
    { $set: { role } },
    { new: true, upsert: true, runValidators: true },
  ).lean()

  return { kind: "success", member, user }
}

export async function updateMemberRole(roomId, userId, role) {
  const room = await Room.findOne({ roomId }).select("_id owner").lean()
  if (!room) {
    return { kind: "room-not-found" }
  }

  if (room.owner.toString() === userId.toString()) {
    return { kind: "owner-protected" }
  }

  const member = await RoomMember.findOneAndUpdate(
    { room: room._id, user: userId },
    { $set: { role } },
    { new: true, runValidators: true },
  ).lean()

  return member ? { kind: "success", member } : { kind: "member-not-found" }
}

export async function removeMember(roomId, userId) {
  const room = await Room.findOne({ roomId }).select("_id owner").lean()
  if (!room) {
    return { kind: "room-not-found" }
  }

  if (room.owner.toString() === userId.toString()) {
    return { kind: "owner-protected" }
  }

  const result = await RoomMember.deleteOne({ room: room._id, user: userId })
  return result.deletedCount ? { kind: "success" } : { kind: "member-not-found" }
}

export async function roomExists(roomId) {
  return Boolean(await Room.exists({ roomId }))
}
