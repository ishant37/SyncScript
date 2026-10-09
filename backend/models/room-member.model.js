import mongoose from "mongoose"

const roomMemberSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["OWNER", "EDITOR", "VIEWER"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

roomMemberSchema.index({ room: 1, user: 1 }, { unique: true })
roomMemberSchema.index({ user: 1, room: 1 })

const RoomMember =
  mongoose.models.RoomMember ||
  mongoose.model("RoomMember", roomMemberSchema)

export default RoomMember
