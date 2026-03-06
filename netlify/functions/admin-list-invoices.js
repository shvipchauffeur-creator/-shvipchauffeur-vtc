const { buildCorsHeaders, handleOptions } = require('./utils/cors');
const { ok, unauthorized, methodNotAllowed, serverError } = require('./utils/response');
const { verifyAdminTokenFromEvent } = require('./utils/auth');
const { getDb } = require('./utils/db');
const { toPositiveInt } = require('./utils/validators');

exports.handler = async (event) => {
  const corsHeaders = buildCorsHeaders(event.headers?.origin || event.headers?.Origin || '');

  try {
    if (event.httpMethod === 'OPTIONS') return handleOptions(event);
    if (event.httpMethod !== 'GET') return methodNotAllowed(['GET'], corsHeaders);
    verifyAdminTokenFromEvent(event);

    const db = await getDb();
    const limit = toPositiveInt(event.queryStringParameters?.limit, 50);

    const invoices = await db
      .collection('invoices')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return ok({ ok: true, invoices }, corsHeaders);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message, corsHeaders);
    return serverError(error, corsHeaders);
  }
};
