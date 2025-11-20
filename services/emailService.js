const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const CryptoHelper = require("../utils/cryptoHelper");
const EmailLog = require("../model/emailLogModel");
const Company = require("../model/company.model");

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

const sendEmail = async (company, customer, subject, message, messageType = "birthday") => {
  try {
    if (!company.gmailRefreshToken) {
      throw new Error("Gmail not connected for this company");
    }

    const refreshToken = CryptoHelper.decrypt(company.gmailRefreshToken);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    let accessToken;
    try {
      accessToken = await oAuth2Client.getAccessToken();
    } catch (tokenError) {
      // Handle expired or invalid refresh token
      if (tokenError.message.includes('invalid_grant') || tokenError.message.includes('unauthorized_client')) {
        // Mark Gmail as disconnected in the database
        await Company.findByIdAndUpdate(company._id, {
          gmailRefreshToken: "",
          replyToEmail: "",
          gmailSetupComplete: false
        });
        throw new Error("Gmail authorization expired. Please reconnect your Gmail account.");
      }
      throw tokenError;
    }

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
      messageType,
      status: "sent",
    });

    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Email sending failed:", error);

    await EmailLog.create({
      company: company._id,
      customer: customer._id,
      subject,
      message,
      messageType,
      status: "failed",
    });

    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
