const app = require("./main");
const database = require("./config/database");
const dotenv = require("dotenv");
const scheduler = require("./services/scheduler")

dotenv.config();

//connect to database
database.connectDB();

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`server started on port ${port}`);
});
