const Company = require("../model/company.model");
const Customer = require("../model/customer.model");
const { sendEmail } = require("../services/emailService");
const { sendSMS } = require("../services/smsService");
const CryptoHelper = require("../utils/cryptoHelper");
const jwt = require("jsonwebtoken");

// ----------------------------
// Auth Helpers
// ----------------------------
function generateToken(company) {
  return jwt.sign(
    { id: company._id, email: company.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

// =======================
// Register company
// =======================
const registerCompany = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await Company.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const company = new Company({ name, email, password });
    await company.save();

    res.status(201).json({ message: "Company registered successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering company", error: err.message });
  }
};

// =======================
// Login company
// =======================
const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email });
    if (!company)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await company.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(company);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

// =======================
// Get company profile
// =======================
const getProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select("-password");
    if (!company) return res.status(404).json({ message: "Company not found" });

    res.json(company);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: err.message });
  }
};

// =======================
// setup SMS
// =======================
const setupSMS = async (req, res) => {
  try {
    const { apiKey, username } = req.body;
    const company = await Company.findById(req.user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    company.smsApiKey = CryptoHelper.encrypt(apiKey);
    company.smsUsername = username;
    company.smsEnabled = true;

    await company.save();
    res.json({ message: "SMS setup successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =======================
// setup Email custom message
// =======================
const setupCustomEmail = async (req, res) => {
  try {
    const { customEmailMessage } = req.body;

    if (!customEmailMessage) {
      return res
        .status(400)
        .json({ message: "Custom email message is required" });
    }

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    company.customEmailMessage = customEmailMessage;
    await company.save();

    res.json({
      message: "Custom email message updated successfully",
    });
  } catch (error) {
    console.error("Error setting custom email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// setup SMS custom message
// =======================
const setupCustomSms = async (req, res) => {
  try {
    const { customSMSMessage } = req.body;

    if (!customSMSMessage) {
      return res
        .status(400)
        .json({ message: "Custom SMS message is required" });
    }

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    company.customSMSMessage = customSMSMessage;
    await company.save();

    res.json({
      message: "Custom SMS message updated successfully",
    });
  } catch (error) {
    console.error("Error setting custom SMS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// Setup Gmail OAuth2
// =======================
const setupGmail = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Generate OAuth URL with company ID as state parameter
    const { google } = require("googleapis");
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    const url = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
      state: company._id.toString(),
    });

    res.json({ authUrl: url });
  } catch (error) {
    console.error("Error setting up Gmail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// Disconnect Gmail OAuth2
// =======================
const disconnectGmail = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Clear Gmail credentials
    company.gmailRefreshToken = "";
    company.replyToEmail = "";
    company.gmailSetupComplete = false;

    await company.save();

    res.json({ message: "Gmail disconnected successfully" });
  } catch (error) {
    console.error("Error disconnecting Gmail:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// Get Gmail Status
// =======================
const getGmailStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select(
      "gmailSetupComplete replyToEmail"
    );
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({
      isConnected: company.gmailSetupComplete,
      email: company.replyToEmail || null,
    });
  } catch (error) {
    console.error("Error getting Gmail status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// =======================
// Send broadcast email to all customers
// =======================
const broadcastEmailToAll = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required"
      });
    }

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.gmailRefreshToken) {
      return res.status(400).json({
        message: "Gmail not configured. Please setup Gmail first."
      });
    }

    let customers = await Customer.find({ companyId: company._id })
      .sort({ name: 1 }); // Sort alphabetically
    
    if (customers.length === 0) {
      return res.status(404).json({
        message: "No customers found for this company"
      });
    }

    // Apply subscription limits
    const messageLimit = company.getMessageLimit();
    if (messageLimit !== Infinity) {
      customers = customers.slice(0, messageLimit);
    }

    const results = [];
    for (const customer of customers) {
      const result = await sendEmail(company, customer, subject, message, "broadcast");
      results.push({
        customerId: customer._id,
        customerEmail: customer.email,
        success: result.success,
        error: result.error || null
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    res.json({
      message: `Broadcast email completed. ${successful} sent, ${failed} failed.`,
      summary: { total: results.length, successful, failed },
      details: results,
      limited: messageLimit !== Infinity,
      messageLimit: messageLimit === Infinity ? "Unlimited" : messageLimit
    });

  } catch (error) {
    console.error("Broadcast email error:", error);
    res.status(500).json({
      message: "Error sending broadcast email",
      error: error.message
    });
  }
};

// =======================
// Send broadcast email to specific customer
// =======================
const broadcastEmailToCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required"
      });
    }

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.gmailRefreshToken) {
      return res.status(400).json({
        message: "Gmail not configured. Please setup Gmail first."
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      companyId: company._id
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found or does not belong to this company"
      });
    }

    const result = await sendEmail(company, customer, subject, message, "broadcast");

    if (result.success) {
      res.json({
        message: "Email sent successfully",
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email
        }
      });
    } else {
      res.status(500).json({
        message: "Failed to send email",
        error: result.error
      });
    }

  } catch (error) {
    console.error("Broadcast email to customer error:", error);
    res.status(500).json({
      message: "Error sending email",
      error: error.message
    });
  }
};

// =======================
// Send broadcast SMS to all customers
// =======================
const broadcastSMSToAll = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required"
      });
    }

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.smsEnabled || !company.smsApiKey || !company.smsUsername) {
      return res.status(400).json({
        message: "SMS not configured. Please setup SMS first."
      });
    }

    let customers = await Customer.find({
      companyId: company._id,
      phone: { $exists: true, $ne: "" }
    }).sort({ name: 1 }); // Sort alphabetically
    
    if (customers.length === 0) {
      return res.status(404).json({
        message: "No customers with phone numbers found for this company"
      });
    }

    // Apply subscription limits
    const messageLimit = company.getMessageLimit();
    if (messageLimit !== Infinity) {
      customers = customers.slice(0, messageLimit);
    }

    const results = [];
    for (const customer of customers) {
      const result = await sendSMS(company, customer, message, "broadcast");
      results.push({
        customerId: customer._id,
        customerPhone: customer.phone,
        success: result.success,
        error: result.error || null
      });
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    res.json({
      message: `Broadcast SMS completed. ${successful} sent, ${failed} failed.`,
      summary: { total: results.length, successful, failed },
      details: results,
      limited: messageLimit !== Infinity,
      messageLimit: messageLimit === Infinity ? "Unlimited" : messageLimit
    });

  } catch (error) {
    console.error("Broadcast SMS error:", error);
    res.status(500).json({
      message: "Error sending broadcast SMS",
      error: error.message
    });
  }
};

// =======================
// Send broadcast SMS to specific customer
// =======================
const broadcastSMSToCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Message is required"
      });
    }

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.smsEnabled || !company.smsApiKey || !company.smsUsername) {
      return res.status(400).json({
        message: "SMS not configured. Please setup SMS first."
      });
    }

    const customer = await Customer.findOne({
      _id: customerId,
      companyId: company._id
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found or does not belong to this company"
      });
    }

    if (!customer.phone) {
      return res.status(400).json({
        message: "Customer does not have a phone number"
      });
    }

    const result = await sendSMS(company, customer, message, "broadcast");

    if (result.success) {
      res.json({
        message: "SMS sent successfully",
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone
        }
      });
    } else {
      res.status(500).json({
        message: "Failed to send SMS",
        error: result.error
      });
    }

  } catch (error) {
    console.error("Broadcast SMS to customer error:", error);
    res.status(500).json({
      message: "Error sending SMS",
      error: error.message
    });
  }
};

// =======================
// Upgrade to premium subscription
// =======================
const upgradeToPremium = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if already premium and not expired
    if (company.isPremium()) {
      return res.status(400).json({
        message: "Company already has premium subscription",
        expiresAt: company.premiumExpiresAt
      });
    }

    company.upgradeToPremium();
    await company.save();

    res.json({
      message: "Successfully upgraded to premium subscription",
      subscriptionStatus: company.subscriptionStatus,
      expiresAt: company.premiumExpiresAt
    });

  } catch (error) {
    console.error("Upgrade to premium error:", error);
    res.status(500).json({
      message: "Error upgrading to premium",
      error: error.message
    });
  }
};

// =======================
// Get subscription status
// =======================
const getSubscriptionStatus = async (req, res) => {
  try {
    const company = await Company.findById(req.user.id).select(
      "subscriptionStatus premiumExpiresAt name email"
    );
    
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const isPremium = company.isPremium();
    const customerCount = await Customer.countDocuments({ companyId: company._id });
    const customerLimit = company.getCustomerLimit();
    const messageLimit = company.getMessageLimit();

    res.json({
      subscriptionStatus: company.subscriptionStatus,
      isPremium,
      expiresAt: company.premiumExpiresAt,
      limits: {
        customers: {
          current: customerCount,
          limit: customerLimit === Infinity ? "Unlimited" : customerLimit,
          canAddMore: customerCount < customerLimit
        },
        messages: {
          limit: messageLimit === Infinity ? "Unlimited" : messageLimit
        },
        logRetention: {
          cleanupEnabled: company.shouldCleanupLogs(),
          retentionDays: company.shouldCleanupLogs() ? 30 : "Permanent"
        }
      }
    });

  } catch (error) {
    console.error("Get subscription status error:", error);
    res.status(500).json({
      message: "Error fetching subscription status",
      error: error.message
    });
  }
};

module.exports = {
  registerCompany,
  loginCompany,
  getProfile,
  setupSMS,
  setupCustomEmail,
  setupCustomSms,
  setupGmail,
  disconnectGmail,
  getGmailStatus,
  broadcastEmailToAll,
  broadcastEmailToCustomer,
  broadcastSMSToAll,
  broadcastSMSToCustomer,
  upgradeToPremium,
  getSubscriptionStatus,
};
