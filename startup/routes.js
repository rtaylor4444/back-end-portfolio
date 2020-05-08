const express = require("express");
const users = require("../routes/users");
const login = require("../routes/login");
const comments = require("../routes/comments");
const error = require("../middleware/error_handler");
const security = require("../middleware/security");

module.exports = function (app) {
  //Middleware
  app.use(express.json());
  app.use(security);

  //Routes
  app.use("/api/users", users);
  app.use("/api/login", login);
  app.use("/api/comments", comments);

  //Error Handling
  app.use(error);
};
