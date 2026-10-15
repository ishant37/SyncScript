import mongoose from "mongoose"

const interviewSchema = new mongoose.Schema(
  {
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    studentEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    scheduledAt: { type: Date, required: true, index: true },
    timeZone: { type: String, required: true, maxlength: 100 },
    durationMinutes: {
      type: Number,
      enum: [30, 45, 60, 90],
      required: true,
    },
    topics: { type: [String], default: [] },
    instructions: { type: String, default: "", maxlength: 2000 },
    roomId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
      index: true,
    },
    invitationStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    invitationError: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
)

const Interview =
  mongoose.models.Interview ||
  mongoose.model("Interview", interviewSchema)

export default Interview
