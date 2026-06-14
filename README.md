<div align="center">
  <h1>🩸 SyncBlood</h1>
  <p><strong>Intelligent, AI-Driven Blood Donation Logistics</strong></p>
  <p>An enterprise-grade platform replacing manual blood donation requests with geospatial routing, predictive machine learning, and generative AI dispatch.</p>
  
  <p>
    <a href="https://syncblood.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/Live_Demo-Deployed_on_Vercel-000000?style=for-the-badge&logo=vercel" alt="Live Demo on Vercel" />
    </a>
  </p>
</div>

---

## 📖 Table of Contents
1. [The Problem Statement](#-the-problem-statement)
2. [The SyncBlood Solution](#-the-syncblood-solution)
3. [Core Architecture & Features](#-core-architecture--features)
4. [Tech Stack](#-tech-stack)
5. [Installation & Local Setup](#-installation--local-setup)
6. [Environment Variables](#-environment-variables)
7. [Deployment Architecture](#-deployment-architecture)
8. [Author](#-author)

---

## 🚨 The Problem Statement
When a hospital requires emergency blood, or when patients with chronic conditions (like Thalassemia) need recurring transfusions, the current logistics system falls apart. Hospitals rely on manual phone calls, outdated spreadsheets, and mass broadcast messages. 

This results in a **Critical Bottleneck**:
* **Wasted Time:** Hours are spent calling donors sequentially.
* **Inefficient Targeting:** Reaching out to donors who are too far away or on a 90-day medical cooldown.
* **Low Conversion:** High administrative effort yields dangerously low actual donor turnout.

---

## 💡 The SyncBlood Solution
SyncBlood treats blood donation as an automated precision logistics problem rather than a manual communication task. 

By combining **MongoDB Geospatial queries**, a **Python Random Forest Machine Learning model**, and **Google Gemini LLM**, SyncBlood autonomously calculates the closest available donors, scores them on historical reliability, and dispatches highly personalized, urgent AI-generated emails to secure a match in seconds.

---

## 🚀 Core Architecture & Features

### 1. The Reactive Pipeline (Emergency SOS Handshake)
When a hospital submits a critical request, the system instantly:
* Runs a `$geoNear` aggregation pipeline to find donors within the specified kilometer radius.
* Filters out donors who have donated in the last 90 days.
* Bridges the Node.js server to a Python script via `child_process` to rank donors using a Random Forest model based on their past reliability/show-up rate.
* Dispatches Google Gemini to write personalized emails, sent via Nodemailer.
* Closes the loop: When a donor clicks "I Will Donate", the hospital dashboard instantly updates with the donor's contact details.

### 2. The Predictive Engine (Zero-Click Dispatch)
Built specifically for recurring patients. Thalassemia patients have predictable, cyclical transfusion needs.
* **Midnight CRON Workers:** A scheduled `node-cron` task scans the database every night at 12:00 AM.
* **7-Day Lookahead:** If a patient needs blood in exactly 7 days, the server autonomously triggers the ML ranking and AI email dispatch—securing a donor before the patient even arrives at the hospital. Zero clicks required from hospital staff.

### 3. Comprehensive Dashboard Ecosystem
* **Admin Portal:** Secure verification system to approve hospital medical certificates.
* **Hospital Portal:** Live mission-control dashboard to create requests and view accepted matches with hero donor details.
* **Donor Portal:** Secure login with HTML5 Geolocation tracking to ensure accurate match proximity.

---

## 🛠 Tech Stack

**Frontend Framework:**
* React (Vite)
* React Router v6
* Axios (with global interceptors)
* Vanilla CSS (Strict Component-level styling)
* Lucide React (Iconography)

**Backend Architecture:**
* Node.js & Express.js
* MongoDB (Mongoose) with Geospatial Indexing (`2dsphere`)
* JSON Web Tokens (JWT) & Bcrypt for secure Role-Based Auth
* `node-cron` for scheduled background tasks

**Cloud Storage & Media:**
* **ImageKit.io:** High-performance CDN for secure storage and delivery of hospital medical verification certificates.

**AI & Machine Learning:**
* **Python:** `scikit-learn` (Random Forest Classifier for donor priority scoring)
* **Google Gemini API:** Large Language Model for autonomous email generation
* **Nodemailer:** Automated SMTP dispatch

---

## ⚙️ Installation & Local Setup

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* MongoDB instance (Local or Atlas)
* Google Gemini API Key
* Gmail App Password (for Nodemailer)
* ImageKit API Keys

---

## 🔐 Environment Variables
Create a .env file in the backend/ directory with the following keys:

* PORT=5000 
* MONGO_URI=your_mongodb_connection_string
* JWT_SECRET=your_super_secret_jwt_key

#Google Gemini AI Dispatcher
* GEMINI_API_KEY=your_gemini_api_key

#Nodemailer SMTP
* EMAIL_USER=your_hospital_gmail@gmail.com
* EMAIL_PASS=your_16_char_google_app_password

#ImageKit CDN
* IMAGEKIT_PUBLIC_KEY=your_public_key
* IMAGEKIT_PRIVATE_KEY=your_private_key
* IMAGEKIT_URL_ENDPOINT=[https://ik.imagekit.io/your_endpoint]

---

## 🌍 Deployment Architecture
The platform is fully deployed and accessible on the grid.

Frontend (Vercel): The React/Vite Single Page Application is hosted on Vercel for lightning-fast edge network delivery.

Backend (Render / Railway): The Node.js Express server runs in a multi-language cloud environment, allowing seamless execution of both standard Node operations and the Python child_process required for the Machine Learning model.

Database (MongoDB Atlas): Data is stored in a globally distributed Atlas cluster, utilizing a critical 2dsphere index on the location fields to enable sub-second $geoNear radius calculations.

Asset Delivery (ImageKit): Certificate uploads are routed directly to ImageKit's global CDN, ensuring the Node.js server is never bottlenecked by heavy file I/O operations.

Live URL: https://syncblood.vercel.app/

---


###  Clone the Repository
```bash
git clone [https://github.com/your-username/SyncBlood.git](https://github.com/your-username/SyncBlood.git)
cd SyncBlood

cd backend
npm install
# Install Python dependencies for the ML model
pip install scikit-learn pandas numpy

cd ../frontend
npm install

# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev



