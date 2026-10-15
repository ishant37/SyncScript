export async function sendInterviewInvitation(interview, interviewer) {
  if ((process.env.EMAIL_PROVIDER || "mock") !== "mock") {
    throw new Error("Only the development mock email provider is configured")
  }

  console.log(
    `Mock interview invitation prepared for ${interview.studentEmail} (${interview._id})`,
  )
  return {
    accepted: true,
    provider: "mock",
    to: interview.studentEmail,
    interviewer: interviewer.username,
  }
}
