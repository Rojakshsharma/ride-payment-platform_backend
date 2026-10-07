import logger from "../config/logger.js";

export default function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${Date.now() - start}ms`,
    });
  });

  next();
}