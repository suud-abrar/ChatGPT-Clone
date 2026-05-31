import https from "https";
BigInt.prototype.toJSON = function () {
  return this.toString();
};
import "dotenv/config";
import express from "express";
import cors from "cors";
// import db from "./src/db/db.config.js";
import prisma from "./src/db/prisma.js";
import mainRouter from "./src/api/main.routes.js";
import { errorHandler } from "./src/middleware/error-handler.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://chatptclone-frontend.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api", mainRouter);
app.use(errorHandler);
async function startServer() {
  try {
    // const connection = await db.getConnection();
    // connection.release();
    await prisma.$connect();
    const PORT = process.env.PORT || 3888;
    app.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`Server is running on port ${PORT}`);
      setInterval(
        () => {
          https
            .get("https://chatptclone.onrender.com/api/health", (res) => {
              console.log(`Self-ping: ${res.statusCode}`);
            })
            .on("error", (e) => {
              console.error("Self-ping failed:", e.message);
            });
        },
        10 * 60 * 1000,
      );
    });
  } catch (error) {
    console.error("error starting server:", error.message);
  }
}

startServer();
