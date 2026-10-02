import express from "express"
import authController from "../controller/auth.controller.js";
import {registerSchema , loginSchema , refreshSchema , validate} from "../validation/auth.validation.js"

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.post(
  "/refresh",
  validate(refreshSchema),
  authController.refresh
);

router.post(
  "/logout",
  validate(refreshSchema),
  authController.logout
);

export default router