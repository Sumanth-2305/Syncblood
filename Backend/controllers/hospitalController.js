import jwt from "jsonwebtoken";
import Hospital from "../models/Hospital.js";
import { uploadCertificate } from "../services/imageKitService.js";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });

export const registerHospital = async (req, res) => {
  const { name, email, password, contactPhone, longitude, latitude } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !contactPhone ||
    longitude === undefined ||
    latitude === undefined
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: "Certificate file is required" });
  }

  const existing = await Hospital.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const certificateUrl = await uploadCertificate(
    req.file.buffer,
    req.file.originalname
  );

  const hospital = await Hospital.create({
    name,
    email,
    password,
    contactPhone,
    location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
    certificateUrl,
  });

  const token = signToken({ id: hospital._id, role: "hospital" });

  return res.status(201).json({
    token,
    hospital: {
      id: hospital._id,
      name: hospital.name,
      email: hospital.email,
      contactPhone: hospital.contactPhone,
      location: hospital.location,
      certificateUrl: hospital.certificateUrl,
      isVerified: hospital.isVerified,
    },
  });
};

export const loginHospital = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const hospital = await Hospital.findOne({ email });
  if (!hospital) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await hospital.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: hospital._id, role: "hospital" });

  return res.json({
    token,
    hospital: {
      id: hospital._id,
      name: hospital.name,
      email: hospital.email,
      contactPhone: hospital.contactPhone,
      location: hospital.location,
      certificateUrl: hospital.certificateUrl,
      isVerified: hospital.isVerified,
    },
  });
};

