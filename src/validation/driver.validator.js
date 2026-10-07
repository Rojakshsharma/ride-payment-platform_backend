import { z } from "zod";

export const createDriverSchema = z.object({
  licenseNumber: z
    .string()
    .trim()
    .min(5, "License number must be at least 5 characters")
    .max(30, "License number must not exceed 30 characters"),

  vehicleNumber: z
    .string()
    .trim()
    .min(5, "Vehicle number must be at least 5 characters")
    .max(20, "Vehicle number must not exceed 20 characters")
});


export const updateDriverStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "OFFLINE"]),
});

export const updateDriverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capturedAt: z.number().int().positive(),
});