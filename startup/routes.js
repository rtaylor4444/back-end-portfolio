const express = require("express");
const error = require("../middleware/error_handler");

module.exports = function (app) {
  //Middleware
  app.use(express.json());

  //Routes

  //Error Handling
  app.use(error);
};
