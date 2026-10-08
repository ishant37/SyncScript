import mongoose from "mongoose"

export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error("MONGO_URI is not configured")
  }

  try {
    await mongoose.connect(mongoUri)
    console.log("MongoDB connected")
  } catch (error) {
    console.error("MongoDB connection failed", error)
    throw error
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}

