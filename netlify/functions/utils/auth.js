const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return secret;
}

function signAdminToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '12h' });
}

function extractBearerToken(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function verifyAdminTokenFromEvent(event) {
  const token = extractBearerToken(event);
  if (!token) {
    const err = new Error('Token manquant');
    err.statusCode = 401;
    throw err;
  }

  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    const err = new Error('Token invalide ou expiré');
    err.statusCode = 401;
    throw err;
  }
}

module.exports = {
  signAdminToken,
  extractBearerToken,
  verifyAdminTokenFromEvent,
};
