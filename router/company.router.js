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

router.get("/", companyController.getProfile);

module.exports = router;
