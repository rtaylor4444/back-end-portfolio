require("./startup/config")();
require("./startup/database")();
const app = require("express")();
require("./startup/routes")(app);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
