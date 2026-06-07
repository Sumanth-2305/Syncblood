import express from "express";
import { loginDonor, registerDonor } from "../controllers/donorController.js";

const router = express.Router();

router.post("/register", registerDonor);
router.post("/login", loginDonor);

export default router;

