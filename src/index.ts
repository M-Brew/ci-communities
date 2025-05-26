import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import communityRoutes from "./routes/communities";
import eventRoutes from "./routes/events";

const { PORT, DB_URI } = process.env;

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/communities", communityRoutes);
app.use("/api/events", eventRoutes);

mongoose.connect(DB_URI);
mongoose.connection.on("open", () =>
  console.log("Connected to database successfully")
);

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
