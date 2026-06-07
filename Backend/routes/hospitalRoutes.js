import express from "express";
import {
  loginHospital,
  registerHospital,
} from "../controllers/hospitalController.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", uploadMiddleware.single("certificate"), registerHospital);
router.post("/login", loginHospital);

export default router;

