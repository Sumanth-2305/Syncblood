import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Donor from "../models/Donor.js";

const buildTransporter = () => {
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
  const secure = process.env.EMAIL_SECURE === "true";

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

function buildDonorPersona(donationCount, frequencyInDays, totalCalls) {
  if (donationCount === 0) return "a first-time donor who has never donated before";
  if (donationCount >= 10) return `a veteran hero donor with ${donationCount} life-saving donations`;
  if (donationCount >= 5) return `an experienced donor with ${donationCount} donations`;

  const freqNote =
    frequencyInDays > 0
      ? `, donating roughly every ${frequencyInDays} days`
      : "";
  return `a committed donor with ${donationCount} donation${donationCount !== 1 ? "s" : ""}${freqNote}`;
}

function buildMatchDescription(score) {
  if (score >= 90) return `${score}% — exceptional compatibility, you are the ideal match`;
  if (score >= 75) return `${score}% — strong match, you are highly suitable`;
  if (score >= 60) return `${score}% — good match, you are a solid candidate`;
  return `${score}% — viable match`;
}

const generateGeminiMessage = async ({
  donorName,
  donorBloodGroup,
  donorPersona,
  matchDescription,
  patientName,
  urgency,
  unitsRequired,
  requiredDonationDate,
  donationUrl,
}) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction:
      "You are a compassionate healthcare outreach coordinator for SyncBlood, an AI-powered blood donor matching platform. " +
      "Your job is to write emotionally resonant, individually crafted email messages to blood donors. " +
      "Each message must feel personally written for the specific person — never use a generic template. " +
      "Your tone adapts: for SOS requests you are urgent and direct; for Standard requests you are warm and encouraging. " +
      "Always write in plain text with no markdown, no asterisks, no bullet points. Never include a subject line in the body.",
  });

  const urgencyContext =
    urgency === "SOS"
      ? "This is a CRITICAL SOS emergency — the patient's life is in immediate danger. The tone must convey extreme urgency."
      : "This is a standard but important request — the tone should be warm, serious, and encouraging.";

  const prompt = [
    `Write a personalized blood donation email for ${donorName}.`,
    "",
    "DONOR PROFILE:",
    `- Name: ${donorName}`,
    `- Blood Group: ${donorBloodGroup}`,
    `- Donor history: ${donorPersona}`,
    `- AI Match Score: ${matchDescription}`,
    "",
    "REQUEST DETAILS:",
    `- Patient Name: ${patientName}`,
    `- Urgency Level: ${urgency}`,
    `- ${urgencyContext}`,
    `- Units Needed: ${unitsRequired}`,
    `- Required By: ${requiredDonationDate}`,
    "",
    "WRITING RULES:",
    `- Address ${donorName} by name in the opening line`,
    `- Reference their donor history meaningfully — a first-timer needs encouragement, a veteran deserves recognition`,
    `- Mention the patient by name (${patientName}) to make it feel real and human`,
    "- The urgency level must shape the entire tone of the message",
    `- End with a single clear call to action and include this URL exactly: ${donationUrl}`,
    "- Write in plain text only — no markdown, no asterisks, no formatting symbols",
    "- Length: 100 to 150 words — enough for genuine emotion and clarity",
    `- CRITICAL: Make this message feel uniquely written for ${donorName} specifically. Do NOT produce a generic template.`,
  ].join("\n");

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

function buildHtmlEmail({ donorName, message, donationUrl, urgency }) {
  const accentColor = urgency === "SOS" ? "#C62828" : "#1565C0";
  const urgencyBanner =
    urgency === "SOS"
      ? `<div style="background:#C62828;color:#fff;padding:10px 24px;font-size:13px;font-weight:700;letter-spacing:1px;text-align:center;">🚨 CRITICAL SOS — IMMEDIATE RESPONSE NEEDED</div>`
      : "";

  const paragraphs = message
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<p style="margin:0 0 12px 0;line-height:1.7;">${l}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#0F1923;padding:20px 24px;text-align:center;">
          <span style="color:#EF5350;font-size:22px;font-weight:800;letter-spacing:1px;">&#9679; SyncBlood</span>
          <p style="color:#8899AA;margin:4px 0 0;font-size:12px;">AI-Powered Blood Donor Matching</p>
        </td></tr>

        <!-- Urgency Banner -->
        ${urgencyBanner}

        <!-- Body -->
        <tr><td style="padding:32px 24px;color:#1a1a2e;font-size:15px;">
          ${paragraphs}
        </td></tr>

        <!-- CTA Button -->
        <tr><td style="padding:0 24px 32px;text-align:center;">
          <a href="${donationUrl}"
             style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.5px;">
            ${urgency === "SOS" ? "🚨 Respond Now" : "Confirm My Donation"}
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#888;">
            Or copy this link: <a href="${donationUrl}" style="color:${accentColor};">${donationUrl}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8f8f8;padding:16px 24px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#aaa;">
            You received this because your blood group matched a hospital's request.<br>
            SyncBlood &mdash; Saving lives through intelligent matching.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const dispatchDonorNotifications = async (topDonors, requestDetails) => {
  const transporter = buildTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";

  const requiredDonationDate = requestDetails?.requiredDonationDate
    ? new Date(requestDetails.requiredDonationDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "as soon as possible";

  const urgency = requestDetails?.urgency || "Standard";
  const subject =
    urgency === "SOS"
      ? `🚨 URGENT SOS: ${requestDetails?.patientBloodGroup || ""} Blood Needed Immediately`
      : `Blood Donation Request — ${requestDetails?.patientBloodGroup || ""} Blood Needed`;

  for (const donor of topDonors) {
    try {
      const donorName = donor.name || "Donor";
      const donorBloodGroup = donor.bloodGroup || "";
      const matchScore =
        donor.match_score !== undefined ? Math.round(donor.match_score) : 0;

      const donorPersona = buildDonorPersona(
        donor.donations_till_date || 0,
        donor.frequency_in_days || 0,
        donor.total_calls || 0
      );
      const matchDescription = buildMatchDescription(matchScore);
      const donationUrl = `${frontendBase}/donor/dashboard?requestId=${requestDetails._id}`;

      let plainText;
      let htmlBody;

      try {
        plainText = await generateGeminiMessage({
          donorName,
          donorBloodGroup,
          donorPersona,
          matchDescription,
          patientName: requestDetails?.patientName || "a patient",
          urgency,
          unitsRequired: requestDetails?.unitsRequired || 1,
          requiredDonationDate,
          donationUrl,
        });
        htmlBody = buildHtmlEmail({ donorName, message: plainText, donationUrl, urgency });
      } catch (llmError) {
        console.error("Gemini generation failed, using fallback:", llmError?.message);
        plainText = `Dear ${donorName},\n\nA ${urgency === "SOS" ? "critical emergency" : "blood donation"} request has been raised for ${requestDetails?.patientName || "a patient"} who needs ${requestDetails?.patientBloodGroup || ""} blood urgently.\n\nAs ${donorPersona}, your contribution can save a life. Please click the link below to confirm your donation:\n\n${donationUrl}\n\nThank you for being a hero.\n\nSyncBlood Team`;
        htmlBody = buildHtmlEmail({ donorName, message: plainText, donationUrl, urgency });
      }

      await transporter.sendMail({
        from,
        to: donor.email,
        subject,
        text: plainText,
        html: htmlBody,
      });

      await Donor.updateOne(
        { _id: donor._id },
        { $inc: { total_calls: 1 }, $set: { last_contacted_date: Date.now() } }
      );
    } catch (error) {
      console.error("Notification dispatch failed:", {
        donorId: donor?._id,
        error: error?.message || error,
      });
    }
  }
};
