require("./startup/config")();
require("./startup/database")();
const app = require("express")();
//BUG - To remove only to test to ensure the server restarts properly
require("express-async-errors");
require("./startup/routes")(app);
require("./startup/production")(app);

const port = process.env.PORT || 5000;
let server;

if (process.env.NODE_ENV === "test") {
  server = app.listen(() => console.log("Setting up test server"));
} else {
  server = app.listen(port, () => console.log(`Listening on port ${port}...`));
}
module.exports = server;
