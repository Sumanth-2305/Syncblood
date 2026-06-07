import express from "express";
import {
  acceptRequest,
  createRequest,
  getAvailableRequests,
  getHospitalDashboard,
} from "../controllers/requestController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, getHospitalDashboard);
router.get("/available", authMiddleware, getAvailableRequests);
router.post("/", authMiddleware, createRequest);
router.post("/:id/accept", authMiddleware, acceptRequest);

export default router;
