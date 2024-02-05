const bcrypt = require("bcryptjs");

const hashPassword = async (passoword) => {
  let salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDs));
  let hash = await bcrypt.hash(passoword, salt);
  return hash;
};

const hashCompare = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = { hashCompare, hashPassword };
