import express from "express";
import RideController from "../controller/ride.controller.js";
import { createRideSchema , confirmRideSchema} from "../validation/ride.validator.js";
import { validate } from "../validation/auth.validation.js";
import authenticate from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/estimate",
  authenticate,
  validate(createRideSchema),
  RideController.estimateRide
);

router.post(
  "/",
  authenticate,
  validate(confirmRideSchema),
  RideController.createRide
);

export default router;