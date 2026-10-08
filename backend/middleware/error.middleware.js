export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
}

export function errorHandler(error, req, res, next) {
  console.error(error)

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Invalid room data",
    })
  }

  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0]
    return res.status(409).json({
      success: false,
      message:
        duplicateField === "email"
          ? "Email already registered"
          : "A record with that value already exists",
    })
  }

  res.status(500).json({
    success: false,
    message: "Failed to process request",
  })
}
