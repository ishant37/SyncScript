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
    return res.status(409).json({
      success: false,
      message: "Room already exists",
    })
  }

  res.status(500).json({
    success: false,
    message: "Failed to process request",
  })
}
