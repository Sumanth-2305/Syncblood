import "dotenv/config";

import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import donorRoutes from "./routes/donorRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";



const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/donors", donorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/requests", requestRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
};

startServer();

