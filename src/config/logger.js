
import pino from "pino";
import fs from "node:fs";
import path from "node:path";

const logDir = path.join(process.cwd(), "logs");

fs.mkdirSync(logDir, { recursive: true });

const streams = [
  {
    stream: pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }),
  },
  {
    stream: fs.createWriteStream(
      path.join(logDir, "app.log"),
      { flags: "a" }
    ),
  },
];

const logger = pino(
  { level: process.env.LOG_LEVEL || "info" },
  pino.multistream(streams)
);

export default logger;
