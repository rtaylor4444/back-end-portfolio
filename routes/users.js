const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const express = require("express");
const router = express.Router();
const { User } = require("../mongoose_models/user");

//GET requests
router.get("/me", auth, async function (req, res) {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

//POST requests
router.post("/", async function (req, res) {
  //Ensure user isn't already registered
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).message("User is already registered");
  user = new User(_.pick(req.body, ["name", "email", "password"]));
  await user.validate();

  //Hash Password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = user.generateAuthToken();
  //Exclude password when sending info to the client
  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["_id", "name", "email"]));
});

module.exports = router;
