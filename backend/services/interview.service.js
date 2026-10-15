import mongoose from "mongoose"
import Interview from "../models/interview.model.js"
import User from "../models/user.model.js"
import * as roomService from "./room.service.js"
import { sendInterviewInvitation } from "./email.service.js"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
function getTimeZoneOffset(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, Number(value)]),
  )
  return Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour % 24,
    values.minute,
    values.second,
  ) - date.getTime()
}

export function parseScheduledAt(date, time, timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format()
  } catch {
    throw new Error("Invalid time zone")
  }

  const local = new Date(`${date}T${time}:00.000Z`)
  if (Number.isNaN(local.getTime())) {
    throw new Error("Invalid interview date or time")
  }

  const first = new Date(local.getTime() - getTimeZoneOffset(local, timeZone))
  return first
}

function publicInterview(interview) {
  return {
    ...interview,
    invitationError: interview.invitationError || undefined,
  }
}

export async function scheduleInterview(input, interviewerId) {
  const studentEmail = input.studentEmail.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(studentEmail)) throw new Error("Invalid student email")
  const scheduledAt = parseScheduledAt(input.date, input.time, input.timeZone)
  if (scheduledAt <= new Date()) throw new Error("Interview must be scheduled in the future")

  const student = await User.findOne({ email: studentEmail }).select("_id").lean()
  const room = await roomService.createRoom(input.title.trim(), interviewerId)
  const interview = await Interview.create({
    interviewerId,
    studentId: student?._id || null,
    studentEmail,
    title: input.title.trim(),
    scheduledAt,
    timeZone: input.timeZone,
    durationMinutes: input.durationMinutes,
    topics: input.topics || [],
    instructions: input.instructions || "",
    roomId: room.room.roomId,
  })

  try {
    await sendInterviewInvitation(interview, await User.findById(interviewerId).lean())
    interview.invitationStatus = "sent"
    await interview.save()
  } catch (error) {
    interview.invitationStatus = "failed"
    interview.invitationError = error.message.slice(0, 500)
    await interview.save()
  }

  return publicInterview(interview.toObject())
}

export async function listInterviews(user) {
  const filter =
    user.role === "interviewer"
      ? { interviewerId: user.userId }
      : { $or: [{ studentId: user.userId }, { studentEmail: user.email }] }
  return (await Interview.find(filter).sort({ scheduledAt: 1 }).lean()).map(publicInterview)
}

export async function getAuthorizedInterview(id, user) {
  if (!mongoose.isValidObjectId(id)) return null
  const interview = await Interview.findById(id).lean()
  if (!interview) return null
  const allowed =
    user.role === "interviewer"
      ? interview.interviewerId.toString() === user.userId
      : interview.studentId?.toString() === user.userId ||
        interview.studentEmail === user.email
  return allowed ? publicInterview(interview) : null
}

export async function joinInterview(id, user) {
  const interview = await getAuthorizedInterview(id, user)
  if (!interview || interview.status !== "scheduled") return null
  const start = interview.scheduledAt.getTime()
  const now = Date.now()
  const earlyMinutes = user.role === "interviewer" ? 15 : 10
  const end = start + interview.durationMinutes * 60_000
  if (now < start - earlyMinutes * 60_000 || now > end) return null

  if (user.role === "student") {
    await roomService.ensureMember(interview.roomId, user.userId, "EDITOR")
  }
  return interview
}
