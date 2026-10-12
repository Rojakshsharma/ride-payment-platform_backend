
import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import { validate } from "../validation/auth.validation.js";
import paymentController from "../controller/payment.controller.js";
import { createPaymentSchema , createPaymentAttemptSchema } from "../validation/payment.validation.js";

const router = Router();

router.post(
    "/",
    authenticate,
    validate(createPaymentSchema),
    paymentController.create
);

router.post(
    "/:paymentId/attempts",
    authenticate,
    validate(createPaymentAttemptSchema),
    paymentController.createAttempt
);

export default router;
