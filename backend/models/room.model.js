import mongoose from "mongoose"

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_document, returnedRoom) => {
        delete returnedRoom._id
      },
    },
  },
)

const Room = mongoose.models.Room || mongoose.model("Room", roomSchema)

export default Room
