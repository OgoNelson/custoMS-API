const express = require("express");

const app = express();

app.use(express.json()); // parse json body

app.get("/", (req, res) => {
  res.send("custoMS API");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

module.exports = app;
