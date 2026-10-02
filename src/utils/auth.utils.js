import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAccessToken = (userId, sessionId) => {
  return jwt.sign(
    {
      userId,
      sessionId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashRefreshToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

export {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
};