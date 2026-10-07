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
            console.log("key created")
            await redisClient.set(redisKey, "ALIVE", {
                EX: 60,
            });
        } else {
            console.log("deleting the key", redisKey)
            await redisClient.del(redisKey);
        }

        return updatedDriver;
    }

    async heartbeat({ userId }) {
        const driver = await prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            const error = new Error("Driver profile not found");
            error.statusCode = 404;
            throw error;
        }

        if (driver.status === "OFFLINE") {
            const error = new Error("Driver is offline");
            error.statusCode = 409;
            throw error;
        }

        const redisKey = `driver:${driver.id}:liveness`;

        console.log("creating the key", redisKey)
        await redisClient.set(redisKey, "ALIVE", {
            EX: 60,
        });

        return {
            driverId: driver.id,
            status: driver.status,
            liveness: "ALIVE",
        };
    }

    async updateLocation({ userId, latitude, longitude, capturedAt }) {
        const driver = await prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            const error = new Error("Driver profile not found");
            error.statusCode = 404;
            throw error;
        }

        if (driver.status === "OFFLINE") {
            const error = new Error("Driver is offline");
            error.statusCode = 409;
            throw error;
        }

        const timestampKey = `driver:${driver.id}:location:timestamp`;

        const currentTimestamp = await redisClient.get(timestampKey);

        if (
            currentTimestamp !== null &&
            capturedAt <= Number(currentTimestamp)
        ) {
            const error = new Error("Stale location update");
            error.statusCode = 409;
            throw error;
        }

        await redisClient.geoAdd("drivers:locations", {
            longitude,
            latitude,
            member: driver.id,
        });

        await redisClient.set(timestampKey, capturedAt);

        return {
            driverId: driver.id,
            latitude,
            longitude,
            capturedAt,
        };
    }
}

export default new DriverService
