
import { Router } from "express";
import authenticate from "../middleware/auth.middleware.js";
import { validate } from "../validation/auth.validation.js";
import paymentController from "../controller/payment.controller.js";
import { createPaymentSchema , createPaymentAttemptSchema ,  paymentIdParamsSchema  , transactionIdParamsSchema , transactionListQuerySchema} from "../validation/payment.validation.js";

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

router.get(
  "/transactions",
  authenticate,
  validate(transactionListQuerySchema, "query"),
  paymentController.getAllTransactions
);

router.get(
  "/:paymentId",
  authenticate,
  validate(paymentIdParamsSchema, "params"),
  paymentController.getById
);


router.get(
  "/transactions/:transactionId",
  authenticate,
  validate(transactionIdParamsSchema, "params"),
  paymentController.getTransactionById
);

export default router;
