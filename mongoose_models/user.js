const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");

const unconfirmedUsers = new Map();
const passResetRequests = new Map();
const emailObj = {
  type: String,
  required: true,
  minlength: 5,
  maxlength: 255,
  unique: true,
  validate: {
    validator: function () {
      let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(this.email);
    },
    message: "Please fill a valid email",
    isAsync: false,
  },
};
const passwordObj = {
  type: String,
  required: true,
  minlength: 5,
  maxlength: 1024,
};

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
    unique: true,
  },
  email: emailObj,
  password: passwordObj,
  isAdmin: { type: Boolean, default: false },
});
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);
const UserValidate = mongoose.model(
  "UserValidate",
  new mongoose.Schema({
    email: emailObj,
    password: passwordObj,
  })
);

module.exports.passResetRequests = passResetRequests;
module.exports.unconfirmedUsers = unconfirmedUsers;
module.exports.User = User;
module.exports.UserValidate = UserValidate;
