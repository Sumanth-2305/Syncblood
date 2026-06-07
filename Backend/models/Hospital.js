import mongoose from "mongoose";
import bcrypt from "bcrypt";

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    contactPhone: { type: String, required: true, trim: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
    },
    certificateUrl: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hospitalSchema.index({ location: "2dsphere" });

hospitalSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

hospitalSchema.methods.matchPassword = async function matchPassword(entered) {
  return bcrypt.compare(entered, this.password);
};

const Hospital = mongoose.model("Hospital", hospitalSchema);

export default Hospital;

