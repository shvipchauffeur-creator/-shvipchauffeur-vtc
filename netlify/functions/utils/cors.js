function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildCorsHeaders(origin) {
  const allowedOrigins = getAllowedOrigins();
  const allowOrigin = allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*');

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

function handleOptions(event) {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  return {
    statusCode: 204,
    headers: buildCorsHeaders(origin),
    body: '',
  };
}

module.exports = { buildCorsHeaders, handleOptions };
