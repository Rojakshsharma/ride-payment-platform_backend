
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import { redisClient } from "../config/redis.js";
import { getRouteDetails } from "./googleMapsService.js";

const QUOTE_TTL_SECONDS = 120;

class RideService {
  async estimateRide(customerId, rideData) {
    const {
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      pickupAddress,
      dropoffAddress,
    } = rideData;

    // 1. Get route details from Google.
    const { distanceMeters, durationSeconds } =
      await getRouteDetails(
        {
          latitude: pickupLatitude,
          longitude: pickupLongitude,
        },
        {
          latitude: dropoffLatitude,
          longitude: dropoffLongitude,
        }
      );

    const estimatedFare = this.calculateFare(
      distanceMeters,
      durationSeconds
    );

    // 3. Create a unique ID for this temporary quote.
    const quoteId = randomUUID();

    const quote = {
      quoteId,
      customerId,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
      pickupAddress,
      dropoffAddress,
      estimatedDistanceMeters: distanceMeters,
      estimatedDurationSeconds: durationSeconds,
      estimatedFare: estimatedFare.toFixed(2),
    };

    // 4. Store the quote in redisClient for 2 minutes.
    await redisClient.set(
      `ride:quote:${quoteId}`,
      JSON.stringify(quote),
      { EX: QUOTE_TTL_SECONDS }
    );

    // 5. Return the quote without creating a ride.
    return {
      ...quote,
      expiresInSeconds: QUOTE_TTL_SECONDS,
    };
  }

  async createRide(customerId, quoteId) {
    const quoteData = await redisClient.get(`ride:quote:${quoteId}`);

    if (!quoteData) {
      const error = new Error(
        "Fare quote expired or not found. Please request a new estimate."
      );
      error.statusCode = 410;
      throw error;
    }

    const quote = JSON.parse(quoteData);

    // 2. Ensure the quote belongs to this user.
    if (quote.customerId !== customerId) {
      const error = new Error(
        "You are not authorized to use this fare quote."
      );
      error.statusCode = 403;
      throw error;
    }

    // 3. Create the actual ride in PostgreSQL.
    const ride = await prisma.ride.create({
      data: {
        customerId,
        pickupLatitude: quote.pickupLatitude,
        pickupLongitude: quote.pickupLongitude,
        dropoffLatitude: quote.dropoffLatitude,
        dropoffLongitude: quote.dropoffLongitude,
        pickupAddress: quote.pickupAddress,
        dropoffAddress: quote.dropoffAddress,
        estimatedDistanceMeters: quote.estimatedDistanceMeters,
        estimatedDurationSeconds: quote.estimatedDurationSeconds,
        estimatedFare: quote.estimatedFare,
        status: "REQUESTED",
      },
    });

    // 4. Remove the quote after successful ride creation.
    await redisClient.del(`ride:quote:${quoteId}`);

    return ride;
  }

  calculateFare(distanceMeters, durationSeconds) {
    // Example rates only; finalize the pricing policy later.
    const BASE_FARE = 30;
    const PER_KM_RATE = 12;
    const PER_MINUTE_RATE = 2;
    const MINIMUM_FARE = 50;

    const distanceKm = distanceMeters / 1000;
    const durationMinutes = durationSeconds / 60;

    const fare =
      BASE_FARE +
      distanceKm * PER_KM_RATE +
      durationMinutes * PER_MINUTE_RATE;

    return (
      Math.round(Math.max(fare, MINIMUM_FARE) * 100) / 100
    );
  }
}

export default new RideService();
