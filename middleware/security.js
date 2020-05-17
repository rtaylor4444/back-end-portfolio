//BUG - CORS policy has to be set properly for now lets allow
//everything to go through for testing purposes
module.exports = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Expose-Headers", "x-auth-token");
  next();
};
