const express = require("express");
const router = express.Router();
const companyController = require("../controller/company.controller");

// =======================
// Public routes
// =======================
router.post("/register", companyController.registerCompany);
router.post("/login", companyController.loginCompany);

module.exports = router;
