const express = require("express");
const bodyParser = require("body-parser");
const users = require("../routes/users");
const login = require("../routes/login");
const comments = require("../routes/comments");
const blog = require("../routes/blogs");
const error = require("../middleware/error_handler");
const security = require("../middleware/security");

module.exports = function (app) {
  //For uploading larger images
  app.use(
    bodyParser.json({
      parameterLimit: 100000,
      limit: "50mb",
      extended: true,
    })
  );
  //Middleware
  app.use(express.json());
  app.use(security);

  //Routes
  app.use("/api/users", users);
  app.use("/api/login", login);
  app.use("/api/comments", comments);
  app.use("/api/blog", blog);

  //Error Handling
  app.use(error);
};
