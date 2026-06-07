import Donor from "../models/Donor.js";
import Hospital from "../models/Hospital.js";
import Request from "../models/Request.js";

import { spawn } from "child_process";
import { dispatchDonorNotifications } from "../services/notificationService.js";

export const createRequest = async (req, res) => {
  if (!req.user || req.user.role !== "hospital") {
    return res.status(403).json({ message: "Hospital access required" });
  }

  const {
    patientName,
    patientBloodGroup,
    requiredDonationDate,
    transfusionCycle,
    unitsRequired,
    urgency,
    maxDistanceMeters,
    maxDistanceKm,
  } = req.body;

  if (
    !patientName ||
    !patientBloodGroup ||
    !requiredDonationDate ||
    transfusionCycle === undefined ||
    unitsRequired === undefined ||
    !urgency
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const parsedRequiredDonationDate = new Date(requiredDonationDate);
  if (Number.isNaN(parsedRequiredDonationDate.getTime())) {
    return res
      .status(400)
      .json({ message: "requiredDonationDate must be a valid date" });
  }

  const hospital = await Hospital.findById(req.user.id);
  if (!hospital) {
    return res.status(401).json({ message: "Invalid hospital token" });
  }

  if (!hospital.isVerified) {
    return res
      .status(403)
      .json({ message: "Hospital is not verified yet" });
  }

  const coords = hospital.location?.coordinates;
  if (!coords || coords.length !== 2) {
    return res.status(400).json({ message: "Hospital location not set" });
  }

  const nearPoint = {
    type: "Point",
    coordinates: [Number(coords[0]), Number(coords[1])],
  };

  let maxDistance = 10000;
  if (maxDistanceMeters !== undefined) {
    const v = Number(maxDistanceMeters);
    if (Number.isFinite(v) && v > 0) maxDistance = v;
  } else if (maxDistanceKm !== undefined) {
    const v = Number(maxDistanceKm);
    if (Number.isFinite(v) && v > 0) maxDistance = v * 1000;
  }

  const request = await Request.create({
    hospitalId: hospital._id,
    patientName,
    patientBloodGroup,
    requiredDonationDate: parsedRequiredDonationDate,
    transfusionCycle: Number(transfusionCycle),
    unitsRequired: Number(unitsRequired),
    urgency,
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const eligibleDonors = await Donor.aggregate([
    {
      $geoNear: {
        near: nearPoint,
        distanceField: "distanceMeters",
        maxDistance,
        spherical: true,
        query: { isAvailable: true },
      },
    },
    {
      $match: {
        bloodGroup: patientBloodGroup,
        $or: [
          { lastDonationDate: { $exists: false } },
          { lastDonationDate: null },
          { lastDonationDate: { $lte: cutoffDate } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        last_contacted_date: 1,
        donations_till_date: 1,
        total_calls: 1,
        frequency_in_days: 1,
        distanceMeters: 1,
      },
    },
  ]);

  const mlPayload = eligibleDonors.map((d) => {
    const donations = Number(d.donations_till_date) || 0;
    const calls = Number(d.total_calls) || 0;

    const callsToDonationsRatio =
      donations === 0 ? 0 : Number((calls / donations).toFixed(2));

    const distanceKm = Number(((Number(d.distanceMeters) || 0) / 1000).toFixed(2));

    return {
      user_id: String(d._id),
      last_contacted_date: Number(d.last_contacted_date) || 0,
      donations_till_date: donations,
      total_calls: calls,
      frequency_in_days: Number(d.frequency_in_days) || 0,
      calls_to_donations_ratio: callsToDonationsRatio,
      distance_km: distanceKm,
    };
  });

  // If no donors were found in the radius, return early to avoid breaking Python
  if (mlPayload.length === 0) {
    return res.status(201).json({ request, matches: [] });
  }

  // 🚀 THE AI BRIDGE: Spawn the Python script
  // Note: If you are on Mac/Linux, you might need to change 'python' to 'python3'
  const pythonProcess = spawn("python", ["predict.py"]);

  let pythonData = "";
  let pythonError = "";

  // 1. Capture the printed JSON from Python
  pythonProcess.stdout.on("data", (data) => {
    pythonData += data.toString();
  });

  // 2. Capture any Python crash errors
  pythonProcess.stderr.on("data", (data) => {
    pythonError += data.toString();
  });

  // 3. When Python finishes closing...
  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("🐍 Python Script Error:", pythonError);
      return res.status(500).json({ message: "AI matching engine failed", error: pythonError });
    }

    try {
      // Parse the AI's string back into a real JavaScript array
      const rankedMatches = JSON.parse(pythonData);

      if (!Array.isArray(rankedMatches)) {
        return res.status(500).json({
          message: "AI matching engine failed",
          error: rankedMatches?.error || "Invalid AI response",
        });
      }

      const top5 = rankedMatches.slice(0, 5);
      const topIds = top5.map((m) => m.user_id);
      const scoreById = new Map(top5.map((m) => [String(m.user_id), m.match_score]));
      
      Donor.find({ _id: { $in: topIds } })
        .select("name email bloodGroup donations_till_date frequency_in_days total_calls")
        .then((donors) => {
          const donorsWithScore = donors.map((d) => ({
            _id: d._id,
            name: d.name,
            email: d.email,
            bloodGroup: d.bloodGroup,
            donations_till_date: d.donations_till_date || 0,
            frequency_in_days: d.frequency_in_days || 0,
            total_calls: d.total_calls || 0,
            match_score: scoreById.get(String(d._id)) || 0,
          }));

          dispatchDonorNotifications(donorsWithScore, request).catch((err) => {
            console.error("Background notification error:", err?.message || err);
          });
        })
        .catch((err) => {
          console.error("Failed to fetch top donor details:", err?.message || err);
        });

      return res.status(201).json({
        request,
        matches: rankedMatches,
      });

    } catch (parseError) {
      console.error("JSON Parse Error from Python:", pythonData);
      return res.status(500).json({ message: "Failed to parse AI response" });
    }
  });

  // 4. Feed the donor data into Python's standard input
  pythonProcess.stdin.write(JSON.stringify(mlPayload));
  pythonProcess.stdin.end();
};

export const acceptRequest = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "donor") {
      return res.status(403).json({ message: "Donor access required" });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "Accepted" || request.status === "Completed") {
      return res
        .status(400)
        .json({ message: "This request has already been fulfilled." });
    }

    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(401).json({ message: "Invalid donor token" });
    }

    request.status = "Accepted";
    request.acceptedBy = donor._id;
    await request.save();

    donor.donations_till_date = (Number(donor.donations_till_date) || 0) + 1;
    donor.lastDonationDate = new Date();
    await donor.save();

    return res
      .status(200)
      .json({ message: "Request accepted successfully", request });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAvailableRequests = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "donor") {
      return res.status(403).json({ message: "Donor access required" });
    }

    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(401).json({ message: "Invalid donor token" });
    }

    const radiusKm = Number(req.query.radiusKm) || 50;
    const maxDistance = radiusKm * 1000;

    const nearbyHospitals = await Hospital.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: donor.location.coordinates },
          distanceField: "distanceMeters",
          maxDistance,
          spherical: true,
        },
      },
      { $project: { _id: 1 } },
    ]);

    const hospitalIds = nearbyHospitals.map((h) => h._id);

    const requests = await Request.find({
      status: "Pending",
      patientBloodGroup: donor.bloodGroup,
      hospitalId: { $in: hospitalIds },
    })
      .populate("hospitalId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getHospitalDashboard = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "hospital") {
      return res.status(403).json({ message: "Hospital access required" });
    }

    const requests = await Request.find({ hospitalId: req.user.id })
      .populate("acceptedBy", "name email phone bloodGroup")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
