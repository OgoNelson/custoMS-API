const express = require("express");
const { google } = require("googleapis");
const Company = require("../model/company.model");
const CryptoHelper = require("../utils/cryptoHelper");

const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Step 1: Redirect to Google
router.get("/google", (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://mail.google.com/"],
  });
  res.redirect(url);
});

// Step 2: Handle callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);

    const company = await Company.findById(req.user.id);
    company.gmailRefreshToken = CryptoHelper.encrypt(tokens.refresh_token);

    if (tokens.id_token) {
      const payload = JSON.parse(
        Buffer.from(tokens.id_token.split(".")[1], "base64").toString()
      );
      company.replyToEmail = payload.email;
    }

    await company.save();
    res.json({
      message: "Gmail connected successfully",
      email: company.replyToEmail,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
