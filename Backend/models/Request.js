import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Donor",
    default: null,
  },
  patientName: { type: String, required: true, trim: true },
  patientBloodGroup: { type: String, required: true, trim: true },
  requiredDonationDate: { type: Date, required: true },
  transfusionCycle: { type: Number, required: true },
  unitsRequired: { type: Number, required: true },
  urgency: { type: String, enum: ["Standard", "SOS"], required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const Request = mongoose.model("Request", requestSchema);

export default Request;
