const Customer = require("../model/customer.model");
const Company = require("../model/company.model");

//  Create a customer
const createCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const { name, email, phone, birthday } = req.body; //birthday format is YYYY-MM-DD
    const company = await Company.findById(companyId);

    // check limit for free plan
    if (company.subscriptionStatus === "free") {
      const count = await Customer.countDocuments({ companyId: companyId });
      if (count >= 7) {
        return res.status(403).json({
          message:
            "Free plan limit reached. Upgrade to premium for unlimited customers.",
        });
      }
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      birthday,
      companyId,
    });
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Customer with this email already exists for your company.",
      });
    }
    res.status(500).json({ error: err.message });
  }
};

//  Get all customers of a company
const getAllCustomers = async (req, res) => {
  try {
    const companyId = req.user.id;
    const customers = await Customer.find({ companyId: companyId });
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Get a single customer
const getCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const customer = await Customer.findOne({
      _id: req.params.id,
      companyId: companyId,
    });
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Update a customer
const updateCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, companyId: companyId },
      req.body,
      { new: true }
    );
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//  Delete a customer
const deleteCustomer = async (req, res) => {
  try {
    const companyId = req.user.id;
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      companyId: companyId,
    });
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};
