const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const router = require("express").Router();
const auth = require("../middleware/auth");
const emailService = require("../services/emailService");
const { User, unconfirmedUsers } = require("../mongoose_models/user");

async function sendConfirmationEmail(email) {
  const comfirmationCode = mongoose.Types.ObjectId().toHexString();
  await emailService.sendConfirmationEmail(comfirmationCode, email);
  return comfirmationCode;
}

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

  const comfirmationCode = await sendConfirmationEmail(user.email);
  const index = unconfirmedUsers.size;
  unconfirmedUsers.set(index, { code: comfirmationCode, user });
  res.send({ index });
});

router.post("/resend", async function (req, res) {
  const index = req.body.index;
  const userInfo = unconfirmedUsers.get(index);
  if (!userInfo)
    return res.status(400).send("User isn't registered; try registering again");

  const newCode = await sendConfirmationEmail(userInfo.user.email);
  unconfirmedUsers.delete(index);
  unconfirmedUsers.set(index, { code: newCode, user: userInfo.user });
  res.send("Sent successfully");
});

router.post("/confirm", async function (req, res) {
  //Ensure user isn't already registered
  const { index, code: sentCode } = req.body;
  const userInfo = unconfirmedUsers.get(index);
  if (!userInfo)
    return res.status(400).send("User isn't registered; try registering again");

  if (sentCode !== userInfo.code)
    return res.status(400).send("Invalid confirmation code");

  unconfirmedUsers.delete(index);
  const user = userInfo.user;
  const token = user.generateAuthToken();
  await user.save();
  //Exclude password when sending info to the client
  res
    .header("x-auth-token", token)
    .send(_.pick(user, ["_id", "name", "email"]));
});

module.exports = router;
