const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const CryptoHelper = require("../utils/cryptoHelper");
const EmailLog = require("../model/emailLogModel");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

const sendEmail = async (company, customer, subject, message) => {
  try {
    if (!company.gmailRefreshToken) {
      throw new Error("Gmail not connected for this company");
    }

    const refreshToken = CryptoHelper.decrypt(company.gmailRefreshToken);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: company.replyToEmail,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken,
        accessToken: accessToken.token,
      },
    });

    await transporter.sendMail({
      from: `"${company.name}" <${company.replyToEmail}>`,
      to: customer.email,
      subject,
      text: message,
    });

    await EmailLog.create({
      company: company._id,
      customer: customer._id,
      subject,
      message,
      status: "sent",
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending failed:", error);

    await EmailLog.create({
      company: company._id,
      customer: customer._id,
      subject,
      message,
      status: "failed",
    });

    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
