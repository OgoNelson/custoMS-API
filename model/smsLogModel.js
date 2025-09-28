const mongoose = require("mongoose");

const smsLogSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["sent", "failed"], default: "sent" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SMSLog", smsLogSchema);
