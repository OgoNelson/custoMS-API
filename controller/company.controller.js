const Company = require("../model/company.model");
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
    const company = await Company.findById(req.user.id).select(
      "-password -gmailRefreshToken"
    );
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

    company.smsApiKey = apiKey;
    company.smsUsername = username;
    company.smsEnabled = true;

    await company.save();
    res.json({ message: "SMS setup successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = { registerCompany, loginCompany, getProfile, setupSMS };
