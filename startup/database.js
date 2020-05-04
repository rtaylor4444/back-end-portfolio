const mongoose = require("mongoose");
const config = require("config");

module.exports = function () {
  console.log(config.get("DB_Connection"));
  mongoose
    .connect(config.get("DB_Connection"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => console.log("Connected to MongoDB"));
};
