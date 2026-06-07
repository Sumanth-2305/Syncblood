import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const donorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, trim: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
    },
    lastDonationDate: { type: Date, default: null },
    last_contacted_date: { type: Number, default: 0 },
    donations_till_date: { type: Number, default: 0 },
    total_calls: { type: Number, default: 0 },
    frequency_in_days: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

donorSchema.index({ location: "2dsphere" });



donorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

donorSchema.methods.matchPassword = async function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

const Donor = mongoose.model("Donor", donorSchema);

export default Donor;
