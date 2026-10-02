import express from "express";

import usersController from "../controller/users.controller.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/me",
  authenticate,
  usersController.getMe
);

export default router;