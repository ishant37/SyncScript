import * as interviewService from "../services/interview.service.js"

function inputError(body = {}) {
  const durations = [30, 45, 60, 90]
  if (!body.title || typeof body.title !== "string") return "Title is required"
  if (!body.studentEmail || typeof body.studentEmail !== "string") return "Student email is required"
  if (!body.date || !body.time || !body.timeZone) return "Date, time, and time zone are required"
  if (!durations.includes(Number(body.durationMinutes))) return "Invalid duration"
  return null
}

export async function createInterview(req, res) {
  const error = inputError(req.body)
  if (error) return res.status(400).json({ success: false, message: error })
  try {
    const interview = await interviewService.scheduleInterview(
      { ...req.body, durationMinutes: Number(req.body.durationMinutes) },
      req.user.userId,
    )
    return res.status(201).json({ success: true, interview })
  } catch (caught) {
    return res.status(400).json({ success: false, message: caught.message })
  }
}

export async function listInterviews(req, res) {
  return res.json({ success: true, interviews: await interviewService.listInterviews(req.user) })
}

export async function getInterview(req, res) {
  const interview = await interviewService.getAuthorizedInterview(req.params.id, req.user)
  return interview
    ? res.json({ success: true, interview })
    : res.status(404).json({ success: false, message: "Interview not found" })
}

export async function joinInterview(req, res) {
  const interview = await interviewService.joinInterview(req.params.id, req.user)
  return interview
    ? res.json({ success: true, interview })
    : res.status(403).json({ success: false, message: "Interview is unavailable or you are not invited" })
}
