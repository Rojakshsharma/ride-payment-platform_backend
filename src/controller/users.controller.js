import usersService from "../services/users.service.js";

class UsersController {
  async getMe(req, res) {
    try {
      const user = await usersService.getMe(req.user.userId);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error(error);

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode
          ? error.message
          : "Internal server error",
      });
    }
  }
}

export default new UsersController();