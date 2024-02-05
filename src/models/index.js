const mongoose = require("mongoose");
require("dotenv").config();

try {
  mongoose.connect(`${process.env.dbUrl}/${process.env.dbName}`);
} catch (err) {
  console.log(err);
}

module.exports = mongoose;
