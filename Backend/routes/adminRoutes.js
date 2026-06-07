import express from "express";
import jwt from "jsonwebtoken";
import Hospital from "../models/Hospital.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { role: "admin", email },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );

  return res.json({ token });
});

router.get(
  "/hospitals/pending",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const hospitals = await Hospital.find({ isVerified: false }).select(
      "-password"
    );
    return res.json({ hospitals });
  }
);

router.put(
  "/hospitals/verify/:id",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select("-password");

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    return res.json({ hospital });
  }
);

export default router;

