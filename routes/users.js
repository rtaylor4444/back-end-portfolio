const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const router = require("express").Router();
const auth = require("../middleware/auth");
const emailService = require("../services/emailService");
const { User, unconfirmedUsers } = require("../mongoose_models/user");

//GET requests
router.get("/me", auth, async function (req, res) {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

//POST requests
router.post("/", async function (req, res) {
  //Ensure user isn't already registered
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User is already registered");
  user = new User(_.pick(req.body, ["name", "email", "password"]));
  await user.validate();

  //Hash Password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  const comfirmationCode = mongoose.Types.ObjectId().toHexString();
  await emailService.sendConfirmationEmail(comfirmationCode, user.email);
  unconfirmedUsers.set(comfirmationCode, user);
  res.send("Email sent successfully!");
});

router.post("/confirm", async function (req, res) {
  //Ensure user isn't already registered
  const code = req.body.code;
  let user = unconfirmedUsers.get(code);
  unconfirmedUsers.delete(code);
  if (!user)
    return res
      .status(400)
      .send("Invalid code or user isn't already registered try again");

  const token = user.generateAuthToken();
  await user.save();
  //Exclude password when sending info to the client
  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["_id", "name", "email"]));
});

module.exports = router;
