import jwt from "jsonwebtoken";
import Donor from "../models/Donor.js";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "30d" });

export const registerDonor = async (req, res) => {
  const { name, email, password, phone, bloodGroup, longitude, latitude,lastDonationDate } =
    req.body;

  if (
    !name ||
    !email ||
    !password ||
    !phone ||
    !bloodGroup ||
    !lastDonationDate||
    longitude === undefined ||
    latitude === undefined
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const existing = await Donor.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const donor = await Donor.create({
    name,
    email,
    password,
    phone,
    bloodGroup,
    location: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
    lastDonationDate
  });

  const token = signToken({ id: donor._id, role: "donor" });

  return res.status(201).json({
    token,
    donor: {
      id: donor._id,
      name: donor.name,
      email: donor.email,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      location: donor.location,
      lastDonationDate: donor.lastDonationDate,
      isAvailable: donor.isAvailable,
    },
  });
};

export const loginDonor = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const donor = await Donor.findOne({ email });
  if (!donor) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await donor.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ id: donor._id, role: "donor" });

  return res.json({
    token,
    donor: {
      id: donor._id,
      name: donor.name,
      email: donor.email,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      location: donor.location,
      lastDonationDate: donor.lastDonationDate,
      isAvailable: donor.isAvailable,
    },
  });
};

