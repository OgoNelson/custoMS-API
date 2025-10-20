const express = require("express");
const { google } = require("googleapis");
const Company = require("../model/company.model");
const CryptoHelper = require("../utils/cryptoHelper");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Step 2: Handle Google OAuth callback
router.get("/google/callback", async (req, res) => {
  console.log("✅ Google redirect hit:", req.query);
  try {
    const { code, state } = req.query;
    const companyId = state;

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get the email from Gmail API
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    const profileResponse = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = profileResponse.data.emailAddress;

    // ✅ Find the company and save encrypted refresh token + email
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    if (tokens.refresh_token) {
      company.gmailRefreshToken = CryptoHelper.encrypt(tokens.refresh_token);
    }

    company.replyToEmail = emailAddress;
    company.gmailSetupComplete = true;
    await company.save();

    return res.json({
      message: "Gmail connected successfully",
      email: userEmail,
    });
  } catch (error) {
    console.error("Google OAuth Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Step 1: Redirect to Google for consent
router.get("/google/:companyId", async (req, res) => {
  console.log("✅ Google auth hit:", req.query);
  const { companyId } = req.params;

  // Generate OAuth URL dynamically with company ID as a state parameter
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
    state: companyId, // keep track of which company is connecting
  });

  res.redirect(url);
});

module.exports = router;
