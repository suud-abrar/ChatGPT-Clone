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

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api", mainRouter);
app.use(errorHandler);
async function startServer() {
  try {
    // const connection = await db.getConnection();
    // connection.release();
    await prisma.$connect(); // 🔥 clean DB connection
    app.listen(3888, (err) => {
      if (err) {
        throw err;
      }
      console.log("Server is running on port http://localhost:3888");
      // Keep alive on Render free tier
      setInterval(
        () => {
          https
            .get("https://your-app-name.onrender.com/api/health", (res) => {
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
