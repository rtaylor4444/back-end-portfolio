const bcrypt = require("bcrypt");
const _ = require("lodash");
const express = require("express");
const router = express.Router();
const { User, UserValidate } = require("../mongoose_models/user");

//POST requests
router.post("/", async function (req, res) {
  //Ensure user is found
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).message("Invalid email or password");
  userValidate = new UserValidate(_.pick(req.body, ["email", "password"]));
  await userValidate.validate();

  //Verify Password
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).message("Invalid email or password");

  const token = user.generateAuthToken();
  res.send(token);
});

module.exports = router;
