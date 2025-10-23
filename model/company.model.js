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

  // // encrypt refresh token if new/changed
  // if (this.isModified("gmailRefreshToken") && this.gmailRefreshToken) {
  //   this.gmailRefreshToken = encrypt(this.gmailRefreshToken);
  // }

  next();
});

//
// 🔑 Instance methods
//
companySchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Company", companySchema);
