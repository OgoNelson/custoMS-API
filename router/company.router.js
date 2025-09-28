const express = require("express");
const router = express.Router();
const companyController = require("../controller/company.controller");
const authCompany = require("../middleware/authCompany.middleware");

// =======================
// Public routes
// =======================
router.post("/register", companyController.registerCompany);
router.post("/login", companyController.loginCompany);

// =======================
// Protected routes (JWT required)
// =======================
router.use(authCompany.authorizeCompany);

//company's profile
router.get("/", companyController.getProfile);

// setup integrations
router.post("/setup-gmail", companyController.setupGmail);
router.post("/setup-sms", companyController.setupSMS);

module.exports = router;
