const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    birthday: {
      type: Date,
      required: true,
    },
    isFrozen: {
      type: Boolean,
      default: false, // used if free plan exceeds limit
    },
  },
  { timestamps: true }
);

//  Prevent duplicate email per company
customerSchema.index({ companyId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Customer", customerSchema);
