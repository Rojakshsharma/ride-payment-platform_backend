
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