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
}

export default new DriverController();