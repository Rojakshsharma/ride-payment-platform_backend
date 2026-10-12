import logger from "../config/logger.js";

export default function errorHandler(error, req, res, next) {
  logger.error(
    {
      err: error,
      method: req.method,
      url: req.originalUrl,
    },
    "Request failed"
  );

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
  });
}