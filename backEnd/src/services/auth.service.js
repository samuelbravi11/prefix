// services/auth.service.js
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS);

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};