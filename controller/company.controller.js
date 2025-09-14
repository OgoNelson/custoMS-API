const Company = require("../model/company.model")
const jwt = require("jsonwebtoken")

// JWT helper
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
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const company = new Company({ name, email, password });
    await company.save();

    res.status(201).json({ message: "Company registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error registering company", error: err.message });
  }
};

// =======================
// Login company
// =======================
const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    const company = await Company.findOne({ email });
    if (!company) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await company.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(company);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

module.exports = {registerCompany, loginCompany}