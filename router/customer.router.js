const express = require("express");
const router = express.Router();
const customerController = require("../controller/customer.controller");
const authCompany = require("../middleware/authCompany.middleware")


// =======================
// Protected routes (JWT required)
// =======================
router.use(authCompany.authorizeCompany)

// All routes are JWT protected
router.post("/", customerController.createCustomer);
router.get("/", customerController.getAllCustomers);
router.get("/:id", customerController.getCustomer);
router.put("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
