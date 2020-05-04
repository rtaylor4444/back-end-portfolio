const config = require("config");

module.exports = function () {
  //Verify that our environment variable is set
  if (!config.get("jwtPrivateKey")) {
    console.error("FATAL ERROR: jwtPrivateKey is not defined.");
    process.exit(1);
  }
};
