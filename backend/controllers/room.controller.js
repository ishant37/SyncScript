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

  const result = await roomService.createRoom(
    requestedName === undefined ? undefined : requestedName.trim(),
    req.user.userId,
  )

  return res.status(201).json({
    success: true,
    room: result.room,
    passcode: result.passcode,
  })
}

export async function joinRoom(req, res) {
  const passcode =
    typeof req.body?.passcode === "string"
      ? req.body.passcode.trim()
      : ""

  if (!passcode) {
    return res.status(400).json({
      success: false,
      message: "Room ID and passcode are required",
    })
  }

  const result = await roomService.joinRoom(
    req.params.roomId,
    passcode,
    req.user.userId,
  )

  if (result.kind === "room-not-found") {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  if (result.kind === "invalid-passcode") {
    return res.status(403).json({
      success: false,
      message: "Incorrect room passcode",
    })
  }

  return res.status(200).json({
    success: true,
    message: "Room joined successfully",
    room: { ...result.room, role: result.role },
  })
}

export async function getRoom(req, res) {
  const access = await roomService.getRoomForUser(
    req.params.roomId,
    req.user.userId,
  )

  if (!access) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    })
  }

  return res.status(200).json({
    message: "Room found",
    success: true,
    room: { ...access.room, role: access.role },
  })
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

export async function listMembers(req, res) {
  const members = await roomService.listMembers(req.params.roomId)
  return res.status(200).json({ success: true, members })
}

export async function addMember(req, res) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : ""
  const role = req.body?.role

  if (!email || !["EDITOR", "VIEWER"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "A valid member email and role (EDITOR or VIEWER) are required",
    })
  }

  const result = await roomService.addMember(req.params.roomId, email, role)
  if (result.kind === "user-not-found") {
    return res.status(404).json({
      success: false,
      message: "User not found",
    })
  }

  return res.status(200).json({
    success: true,
    message: "Member added successfully",
    member: result.member,
  })
}

export async function updateMemberRole(req, res) {
  const role = req.body?.role
  if (!["EDITOR", "VIEWER"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be EDITOR or VIEWER",
    })
  }

  const result = await roomService.updateMemberRole(
    req.params.roomId,
    req.params.userId,
    role,
  )

  if (result.kind === "member-not-found") {
    return res.status(404).json({ success: false, message: "Member not found" })
  }

  if (result.kind === "owner-protected") {
    return res.status(400).json({
      success: false,
      message: "The room owner role cannot be changed",
    })
  }

  return res.status(200).json({
    success: true,
    message: "Member role updated successfully",
    member: result.member,
  })
}

export async function removeMember(req, res) {
  const result = await roomService.removeMember(
    req.params.roomId,
    req.params.userId,
  )

  if (result.kind === "member-not-found") {
    return res.status(404).json({ success: false, message: "Member not found" })
  }

  if (result.kind === "owner-protected") {
    return res.status(400).json({
      success: false,
      message: "The room owner cannot be removed",
    })
  }

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  })
}
