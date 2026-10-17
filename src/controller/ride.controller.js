import rideService from "../services/ride.service.js";

class RideController {
  async estimateRide(req, res, next) {
    try {
      const customerId = req.user.userId;

      const quote = await rideService.estimateRide(
        customerId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Fare estimate generated successfully",
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  async createRide(req, res, next) {
    try {
      const customerId = req.user.userId;

      const ride = await rideService.createRide(
        customerId,
        req.body.quoteId
      );

      return res.status(201).json({
        success: true,
        message: "Ride created successfully",
        data: ride,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RideController();