import express from "express";
import { connectDatabase } from "./config/database.js";

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok"
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();