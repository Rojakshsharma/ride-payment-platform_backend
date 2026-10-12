
import { Router } from "express";
import express from "express";
import paymentController from "../controller/payment.controller.js";

const router = Router();

router.post(
    "/stripe",
    express.raw({ type: "application/json" }),
    paymentController.handle
);


export default router;
