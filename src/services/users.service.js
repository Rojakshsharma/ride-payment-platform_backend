import { prisma } from "../config/database.js"

class UsersService {
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return user;
  }
}

export default new UsersService();