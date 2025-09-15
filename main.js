const express = require("express");
const companyRouter = require("./router/company.router");
const customerRouter = require("./router/customer.router")

const app = express();

app.use(express.json()); // parse json body

app.get("/", (req, res) => {
  res.send("custoMS API");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

//routes
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/company/customers", customerRouter);

module.exports = app;
