import express from "express";

import authRoutes from "./src/routes/auth.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import driverRouter from "./src/routes/driver.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import webhookRoutes from "./src/routes/webhook.routes.js"

import requestLogger from "./src/middleware/requestLogger.middleware.js";
import errorHandler from "./src/middleware/error.middleware.js";
import { startServer } from "./src/server.js";

const app = express();

app.use("/api/webhooks", webhookRoutes);

app.use(express.json());

app.use(requestLogger);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/drivers", driverRouter);
app.use("/api/payments", paymentRoutes);


app.use(errorHandler);

startServer(app);

export default app;