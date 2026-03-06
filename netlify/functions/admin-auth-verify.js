const { buildCorsHeaders, handleOptions } = require('./utils/cors');
const { ok, unauthorized, methodNotAllowed, serverError } = require('./utils/response');
const { verifyAdminTokenFromEvent } = require('./utils/auth');

exports.handler = async (event) => {
  const corsHeaders = buildCorsHeaders(event.headers?.origin || event.headers?.Origin || '');

  try {
    if (event.httpMethod === 'OPTIONS') return handleOptions(event);
    if (event.httpMethod !== 'GET') return methodNotAllowed(['GET'], corsHeaders);

    const payload = verifyAdminTokenFromEvent(event);
    return ok({ ok: true, admin: payload }, corsHeaders);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message, corsHeaders);
    return serverError(error, corsHeaders);
  }
};
