import mongoose from "mongoose";
import dotenv from "dotenv";
import Donor from "./models/Donor.js"; // Ensure the path and .js extension is correct
import Hospital from "./models/Hospital.js";

dotenv.config();

// Base Coordinates
const HYD = { lng: 78.3828, lat: 17.4399 };
const BLR = { lng: 77.5946, lat: 12.9716 };

// Helper to generate coordinates within ~5-10km of the city center
const randomizeLocation = (baseLng, baseLat) => [
  baseLng + (Math.random() - 0.5) * 0.1,
  baseLat + (Math.random() - 0.5) * 0.1,
];

// Date Generator (to dynamically create lastDonationDate)
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Clear existing data
    await Donor.deleteMany({});
    await Hospital.deleteMany({});
    console.log("Cleared old database records.");

    // ==========================================
    // 1. SEED HOSPITALS (5 Total)
    // ==========================================
    const hospitals = [
      {
        name: "Hyderabad Central Trauma",
        email: "trauma@hyd.com",
        password: "password123",
        contactPhone: "9999999991",
        location: { type: "Point", coordinates: [HYD.lng, HYD.lat] },
        certificateUrl: "https://example.com/cert1.pdf",
        isVerified: true,
      },
      {
        name: "Gachibowli General Hospital",
        email: "general@hyd.com",
        password: "password123",
        contactPhone: "9999999992",
        location: { type: "Point", coordinates: randomizeLocation(HYD.lng, HYD.lat) },
        certificateUrl: "https://example.com/cert2.pdf",
        isVerified: true,
      },
      {
        name: "Jubilee Hills Clinic",
        email: "clinic@hyd.com",
        password: "password123",
        contactPhone: "9999999993",
        location: { type: "Point", coordinates: randomizeLocation(HYD.lng, HYD.lat) },
        certificateUrl: "https://example.com/cert3.pdf",
        isVerified: false, // Unverified test case
      },
      {
        name: "Bangalore Lifeline Hospital",
        email: "lifeline@blr.com",
        password: "password123",
        contactPhone: "9999999994",
        location: { type: "Point", coordinates: [BLR.lng, BLR.lat] },
        certificateUrl: "https://example.com/cert4.pdf",
        isVerified: true,
      },
      {
        name: "Koramangala Blood Bank",
        email: "bloodbank@blr.com",
        password: "password123",
        contactPhone: "9999999995",
        location: { type: "Point", coordinates: randomizeLocation(BLR.lng, BLR.lat) },
        certificateUrl: "https://example.com/cert5.pdf",
        isVerified: true,
      },
    ];

    // Using .create() so your bcrypt pre-save hooks execute!
    for (const h of hospitals) await Hospital.create(h);
    console.log("🏥 5 Hospitals Injected!");

    // ==========================================
    // 2. SEED EDGE-CASE DONORS
    // ==========================================
    const edgeCaseDonors = [
      {
        name: "The Hero (Hyderabad)", // ML should score this 99%
        email: "hero@hyd.com",
        password: "password123",
        phone: "8888888801",
        bloodGroup: "O+",
        location: { type: "Point", coordinates: randomizeLocation(HYD.lng, HYD.lat) },
        lastDonationDate: daysAgo(120), // 120 days ago (Passes 90-day cooldown)
        last_contacted_date: 5,
        donations_till_date: 10,
        total_calls: 10, // Ratio: 1.0
        frequency_in_days: 90,
      },
      {
        name: "The Ghost (Hyderabad)", // ML should score this 1%
        email: "ajaychakridegala@gmail.com",
        password: "password123",
        phone: "8888888802",
        bloodGroup: "O+",
        location: { type: "Point", coordinates: randomizeLocation(HYD.lng, HYD.lat) },
        lastDonationDate: null, // Never donated
        last_contacted_date: 200,
        donations_till_date: 0,
        total_calls: 15, // Ratio: 0.0
        frequency_in_days: 0,
      },
      {
        name: "The Cooldown Block (Bangalore)", // Should be blocked by $match stage
        email: "cooldown@blr.com",
        password: "password123",
        phone: "8888888803",
        bloodGroup: "A+",
        location: { type: "Point", coordinates: randomizeLocation(BLR.lng, BLR.lat) },
        lastDonationDate: daysAgo(10), // Donated 10 days ago!
        last_contacted_date: 12,
        donations_till_date: 5,
        total_calls: 5, // Ratio 1.0 (but medically ineligible)
        frequency_in_days: 60,
      },
    ];

    // ==========================================
    // 3. SEED RANDOM DONORS (To reach 25)
    // ==========================================
    const randomDonors = [];
    const bloodGroups = ["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"];
    
    for (let i = 4; i <= 25; i++) {
      // Split remaining 22 donors between Hyd and Blr
      const isHyd = i % 2 === 0; 
      const centerLng = isHyd ? HYD.lng : BLR.lng;
      const centerLat = isHyd ? HYD.lat : BLR.lat;
      const bGroup = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];

      randomDonors.push({
        name: `Random Donor ${i}`,
        email: `donor${i}@test.com`,
        password: "password123",
        phone: `88888888${i.toString().padStart(2, "0")}`,
        bloodGroup: bGroup,
        location: { type: "Point", coordinates: randomizeLocation(centerLng, centerLat) },
        // Randomly set a valid donation date (100 to 400 days ago) or null
        lastDonationDate: Math.random() > 0.3 ? daysAgo(Math.floor(Math.random() * 300) + 100) : null,
        last_contacted_date: Math.floor(Math.random() * 60),
        donations_till_date: Math.floor(Math.random() * 5),
        total_calls: Math.floor(Math.random() * 10) + 1,
        frequency_in_days: Math.floor(Math.random() * 100),
      });
    }

    const allDonors = [...edgeCaseDonors, ...randomDonors];
    for (const d of allDonors) await Donor.create(d);
    
    console.log("🩸 25 Donors Injected!");
    console.log("✅ Seed complete. Ready for ML Matching.");

    process.exit();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedDatabase();