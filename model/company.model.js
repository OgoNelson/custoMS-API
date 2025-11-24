const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { encrypt } = require("../utils/cryptoHelper");

const companySchema = new mongoose.Schema(
  {
    // Basic info
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, //main company's email
    password: { type: String, required: true }, // stored hashed

    // Gmail OAuth2 integration
    gmailRefreshToken: { type: String, default: "" }, // stored ENCRYPTED
    replyToEmail: { type: String }, // email where replies are sent to. e.g support@example.com
    gmailSetupComplete: { type: Boolean, default: false }, // track if Gmail OAuth2 is set up

    // SMS setup per company
    smsEnabled: { type: Boolean, default: false },
    smsApiKey: { type: String, select: false },
    smsUsername: { type: String },

    // Custom Birthday Messages
    customEmailMessage: { type: String, default: "" },
    customSMSMessage: { type: String, default: "" },

    // Subscription
    subscriptionStatus: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    premiumExpiresAt: { type: Date }, // when premium ends
  },
  { timestamps: true }
);

//
// 🔑 Pre-save hooks
//
companySchema.pre("save", async function (next) {
  // hash password if new/changed
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

//
// 🔑 Instance methods
//
companySchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if company has premium subscription
companySchema.methods.isPremium = function () {
  if (this.subscriptionStatus !== "premium") return false;
  
  // Check if premium has expired
  if (this.premiumExpiresAt && new Date() > this.premiumExpiresAt) {
    // Auto-revert to free plan
    this.subscriptionStatus = "free";
    this.premiumExpiresAt = undefined;
    this.save();
    return false;
  }
  
  return true;
};

// Get customer limit based on subscription
companySchema.methods.getCustomerLimit = function () {
  return this.isPremium() ? Infinity : 7;
};

// Get message limit for broadcasts/birthday (first 7 for free)
companySchema.methods.getMessageLimit = function () {
  return this.isPremium() ? Infinity : 7;
};

// Check if logs should be cleaned up (30 days for free, permanent for premium)
companySchema.methods.shouldCleanupLogs = function () {
  return !this.isPremium();
};

// Upgrade to premium
companySchema.methods.upgradeToPremium = function () {
  this.subscriptionStatus = "premium";
  this.premiumExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
};

module.exports = mongoose.model("Company", companySchema);
