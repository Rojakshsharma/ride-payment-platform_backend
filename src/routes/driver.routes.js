import { Router } from "express";

import  DriverController  from "../controller/driver.controller.js";
import  authenticate from "../middleware/auth.middleware.js";
import { createDriverSchema ,updateDriverStatusSchema , updateDriverLocationSchema} from "../validation/driver.validator.js";
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


router.post(
    "/heartbeat",
    authenticate,
    DriverController.heartbeat
);

router.patch(
  "/location",
  authenticate,
  validate(updateDriverLocationSchema),
  DriverController.updateLocation
);
export default router;