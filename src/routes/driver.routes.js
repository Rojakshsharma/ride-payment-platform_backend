import { Router } from "express";

import  DriverController  from "../controller/driver.controller.js";
import  authenticate from "../middleware/auth.middleware.js";
import { createDriverSchema ,updateDriverStatusSchema } from "../validation/driver.validator.js";
import { validate} from "../validation/auth.validation.js"


const router = Router();

router.post(
  "/",
  authenticate,
  validate(createDriverSchema),
  DriverController.createDriver
);

router.patch(
  "/status",
  authenticate,
  validate(updateDriverStatusSchema),
  DriverController.updateStatus
);

export default router;