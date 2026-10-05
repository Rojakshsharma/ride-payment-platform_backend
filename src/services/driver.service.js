import { prisma } from "../config/database.js"
import { redisClient } from "../config/redis.js";

class DriverService {
    async createDriver({ userId, licenseNumber, vehicleNumber }) {

        console.log("data......:", userId, licenseNumber, vehicleNumber);
        return prisma.$transaction(async (tx) => {
            const existingDriver = await tx.driver.findUnique({
                where: { userId },
            });

            if (existingDriver) {
                const error = new Error("Driver profile already exists");
                error.statusCode = 409;
                throw error;
            }

            const driver = await tx.driver.create({
                data: {
                    userId,
                    licenseNumber,
                    vehicleNumber,
                },
            });

            await tx.user.update({
                where: { id: userId },
                data: {
                    role: "DRIVER",
                },
            });

            return driver;
        });
    }

    async updateStatus({ userId, status }) {
        const driver = await prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            const error = new Error("Driver profile not found");
            error.statusCode = 404;
            throw error;
        }

        // Driver cannot manually change BUSY status.
        if (driver.status === "BUSY") {
            const error = new Error("Cannot change status while driver is busy");
            error.statusCode = 409;
            throw error;
        }

        // No change needed.
        if (driver.status === status) {
            return driver;
        }

        const updatedDriver = await prisma.driver.update({
            where: { id: driver.id },
            data: {
                status,
            },
        });

        const redisKey = `driver:${driver.id}:liveness`;

        if (status === "AVAILABLE") {
            await redisClient.set(redisKey, "ALIVE", {
                EX: 60,
            });
        } else {
            console.log("deleting the key")
            await redisClient.del(redisKey);
        }

        return updatedDriver;
    }
}

export default new DriverService
