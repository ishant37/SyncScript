import * as authService from "../services/auth.service.js"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegistrationInput(body = {}) {
  const username = typeof body.username === "string" ? body.username.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!username || username.length > 50) {
    return "Username is required and must be 50 characters or fewer"
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "A valid email is required"
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters"
  }

  return null
}

export async function register(req, res) {
  const validationError = validateRegistrationInput(req.body)
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError })
  }

  const user = await authService.registerUser({
    username: req.body.username.trim(),
    email: req.body.email.trim().toLowerCase(),
    password: req.body.password,
  })

  return res.status(201).json({
    success: true,
    message: "User registered successfully",
    user,
  })
}

export async function login(req, res) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : ""
  const password = typeof req.body?.password === "string" ? req.body.password : ""

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    })
  }

  const result = await authService.loginUser(email, password)
  if (!result) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    })
  }

  return res.status(200).json({
    success: true,
    message: "Login successful",
    ...result,
  })
}

export async function getMe(req, res) {
  const user = await authService.getUserById(req.user.userId)

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }

  return res.status(200).json({
    success: true,
    user: authService.toSafeUser(user),
  })
}
