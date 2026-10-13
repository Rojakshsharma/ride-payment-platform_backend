
import { z } from "zod";

export const createPaymentSchema = z.object({
  rideId: z.string().trim().min(1, "Ride ID is required").optional(),
});

export const createPaymentAttemptSchema = z.object({
  idempotencyKey: z
    .string()
    .trim()
    .min(1, "Idempotency key is required")
    .max(200, "Idempotency key cannot exceed 200 characters"),
});

export const paymentIdParamsSchema = z.object({
  paymentId: z.string().uuid(),
});

export const transactionIdParamsSchema = z.object({
  transactionId: z.string().uuid(),
});

export const transactionListQuerySchema = z.object({
  pageNumber: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(""),
});
