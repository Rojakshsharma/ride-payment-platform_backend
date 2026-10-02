import jwt from "jsonwebtoken";
import { prisma } from "../config/database.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const accessToken = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const session = await prisma.session.findUnique({
      where: {
        id: decoded.sessionId,
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session not found",
      });
    }

    if (
      !session.isValid ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      return res.status(401).json({
        success: false,
        message: "Session is no longer valid",
      });
    }

    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    next(error);
  }
};

export default authenticate;