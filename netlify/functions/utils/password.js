const bcrypt = require('bcryptjs');

async function verifyPassword(plainText, hash) {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}

module.exports = { verifyPassword };
