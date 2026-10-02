import authService from "../services/auth.service.js";

class AuthController {
  async register(req, res) {
    try {
      const user = await authService.register(req.body);

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
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

  async login(req, res) {
    try {
      const tokens = await authService.login(req.body);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: tokens,
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

  async refresh(req, res) {
    try {
      const tokens = await authService.refresh(
        req.body.refreshToken
      );

      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: tokens,
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

  async logout(req, res) {
    try {
      await authService.logout(req.body.refreshToken);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
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

export default new AuthController