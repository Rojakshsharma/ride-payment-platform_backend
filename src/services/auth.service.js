import bcrypt from "bcrypt"
import { prisma } from "../config/database.js"
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../utils/auth.utils.js";

class AuthService {
  async register(data) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      const error = new Error("Email already registered");
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          age: data.age,
          gender: data.gender,
        },
        select: {
          id: true,
          name: true,
          email: true,
          age: true,
          gender: true,
          role: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error.code === "P2002") {
        const conflict = new Error("Email already registered");
        conflict.statusCode = 409;
        throw conflict;
      }

      throw error;
    }
  }


  async login(data) {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const passwordMatch = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!passwordMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const sessionExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: sessionExpiresAt,

        refreshTokens: {
          create: {
            tokenHash: refreshTokenHash,
            expiresAt: sessionExpiresAt,
          },
        },
      },
    });

    const accessToken = generateAccessToken(
      user.id,
      session.id
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        session: true,
      },
    });

    // Token doesn't exist
    if (!storedToken) {
      const error = new Error("Invalid refresh token");
      error.statusCode = 401;
      throw error;
    }

    // Token was already used/revoked → replay detected
    if (storedToken.revokedAt) {
      const revokedAt = new Date();

      await prisma.$transaction(async (tx) => {
        // Revoke all active sessions of the user
        await tx.session.updateMany({
          where: {
            userId: storedToken.session.userId,
            isValid: true,
          },
          data: {
            isValid: false,
            revokedAt,
          },
        });

        // Revoke all active refresh tokens of those sessions
        await tx.refreshToken.updateMany({
          where: {
            session: {
              userId: storedToken.session.userId,
            },
            revokedAt: null,
          },
          data: {
            revokedAt,
          },
        });
      });

      const error = new Error("Refresh token reuse detected");
      error.statusCode = 401;
      throw error;
    }
    const now = new Date();

    // Refresh token expired
    if (storedToken.expiresAt <= now) {
      const error = new Error("Refresh token expired");
      error.statusCode = 401;
      throw error;
    }

    // Session is revoked/expired
    if (
      !storedToken.session.isValid ||
      storedToken.session.revokedAt ||
      storedToken.session.expiresAt <= now
    ) {
      const error = new Error("Session is no longer valid");
      error.statusCode = 401;
      throw error;
    }

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);

    // Rotate old token → new token
    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: {
          id: storedToken.id,
        },
        data: {
          revokedAt: now,
        },
      });

      await tx.refreshToken.create({
        data: {
          sessionId: storedToken.sessionId,
          tokenHash: newTokenHash,
          expiresAt: storedToken.session.expiresAt,
        },
      });
    });

    // Generate new access token
    const accessToken = generateAccessToken(
      storedToken.session.userId,
      storedToken.sessionId
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken) {
    const refreshTokenHash = hashRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: refreshTokenHash,
      },
    });

    // Already invalid / doesn't exist
    if (!storedToken) {
      return;
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: {
          id: storedToken.sessionId,
        },
        data: {
          isValid: false,
          revokedAt: storedToken.revokedAt ?? now,
        },
      });

      await tx.refreshToken.updateMany({
        where: {
          sessionId: storedToken.sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });
    });
  }
}

export default new AuthService