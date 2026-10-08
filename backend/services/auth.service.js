import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import User from "../models/user.model.js"

const SALT_ROUNDS = 12

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured")
  }

  return process.env.JWT_SECRET
}

export function toSafeUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
  }
}

export async function registerUser({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await User.create({ username, email, passwordHash })
  return toSafeUser(user)
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email }).select("+passwordHash")

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null
  }

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  )

  return { token, user: toSafeUser(user) }
}

export async function getUserById(userId) {
  if (!mongoose.isValidObjectId(userId)) {
    return null
  }

  return User.findById(userId).lean()
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret())
}
