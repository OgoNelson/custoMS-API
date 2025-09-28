const express = require("express");
const router = express.Router();
const companyController = require("../controller/company.controller");
const authCompany = require("../middleware/authCompany.middleware");
const authRouter = require("./auth.router")

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
router.post("/setup-sms", companyController.setupSMS);

// Google OAuth2 flow
router.use("/auth", authRouter);

// setup custom Email and SMS message route
router.post("/custom-email", companyController.setupCustomEmail);
router.post("/custom-sms", companyController.setupCustomSms);

module.exports = router;
