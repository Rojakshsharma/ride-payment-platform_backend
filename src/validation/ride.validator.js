import { z } from "zod";

const createRideSchema = z.object({
  pickupLatitude: z.coerce.number().min(-90).max(90),
  pickupLongitude: z.coerce.number().min(-180).max(180),
  dropoffLatitude: z.coerce.number().min(-90).max(90),
  dropoffLongitude: z.coerce.number().min(-180).max(180),
  pickupAddress: z.string().trim().min(1).max(300),
  dropoffAddress: z.string().trim().min(1).max(300),
});

const confirmRideSchema = z.object({
  quoteId: z.string().trim().min(1),
});

export { createRideSchema, confirmRideSchema };