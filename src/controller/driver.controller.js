import driverService from "../services/driver.service.js";

class DriverController {
    async createDriver(req, res, next) {
        console.log("REQ.USER:", req.user);
        try {
            const driver = await driverService.createDriver({
                userId: req.user.userId,
                licenseNumber: req.body.licenseNumber,
                vehicleNumber: req.body.vehicleNumber,
            });

            return res.status(201).json({
                message: "Driver profile created successfully",
                driver,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const driver = await driverService.updateStatus({
                userId: req.user.userId,
                status: req.body.status,
            });

            return res.status(200).json({
                message: "Driver status updated successfully",
                driver,
            });
        } catch (error) {
            next(error);
        }
    }

    async heartbeat(req, res, next) {
        try {
            const result = await driverService.heartbeat({
                userId: req.user.userId,
            });

            return res.status(200).json({
                message: "Heartbeat received",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateLocation(req, res, next) {
        try {
            const result = await driverService.updateLocation({
                userId: req.user.userId,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                capturedAt: req.body.capturedAt,
            });

            return res.status(200).json({
                message: "Driver location updated successfully",
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new DriverController();