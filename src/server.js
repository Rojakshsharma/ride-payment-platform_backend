import express from "express";
import { connectDatabase } from "./config/database.js";
import { connectRedis } from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js"
import usersRoutes from "./routes/users.routes.js";
import driverRouter from "./routes/driver.routes.js";


const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/drivers", driverRouter);

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();