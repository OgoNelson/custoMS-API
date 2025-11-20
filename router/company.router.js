const express = require("express");
const router = express.Router();
const companyController = require("../controller/company.controller");
const authCompany = require("../middleware/authCompany.middleware");
const authRouter = require("./auth.router");

// =======================
// Public routes
// =======================
router.post("/register", companyController.registerCompany);
router.post("/login", companyController.loginCompany);

// Google OAuth2 flow
router.use("/auth", authRouter);

// =======================
// Protected routes (JWT required)
// =======================
router.use(authCompany.authorizeCompany);

//company's profile
router.get("/", companyController.getProfile);

// setup integrations
router.post("/setup-sms", companyController.setupSMS);

// Gmail OAuth2 setup routes
router.post("/setup-gmail", companyController.setupGmail);
router.post("/disconnect-gmail", companyController.disconnectGmail);
router.get("/gmail-status", companyController.getGmailStatus);

// setup custom Email and SMS message route
router.post("/custom-email", companyController.setupCustomEmail);
router.post("/custom-sms", companyController.setupCustomSms);

// broadcast email routes
router.post("/broadcast-email/all", companyController.broadcastEmailToAll);
router.post("/broadcast-email/:customerId", companyController.broadcastEmailToCustomer);

// broadcast SMS routes
router.post("/broadcast-sms/all", companyController.broadcastSMSToAll);
router.post("/broadcast-sms/:customerId", companyController.broadcastSMSToCustomer);

module.exports = router;
