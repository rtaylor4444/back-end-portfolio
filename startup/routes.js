const express = require("express");
const users = require("../routes/users");
const error = require("../middleware/error_handler");

module.exports = function (app) {
  //Middleware
  app.use(express.json());

  //Routes
  app.use("/api/users", users);

  //Error Handling
  app.use(error);
};
