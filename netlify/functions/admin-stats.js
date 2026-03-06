const { buildCorsHeaders, handleOptions } = require('./utils/cors');
const { ok, unauthorized, methodNotAllowed, serverError } = require('./utils/response');
const { verifyAdminTokenFromEvent } = require('./utils/auth');
const { getDb } = require('./utils/db');

exports.handler = async (event) => {
  const corsHeaders = buildCorsHeaders(event.headers?.origin || event.headers?.Origin || '');
  try {
    if (event.httpMethod === 'OPTIONS') return handleOptions(event);
    if (event.httpMethod !== 'GET') return methodNotAllowed(['GET'], corsHeaders);
    verifyAdminTokenFromEvent(event);

    const db = await getDb();
    const [reservations, quotes, payments, invoices, drivers, clients] = await Promise.all([
      db.collection('reservations').countDocuments(),
      db.collection('quotes').countDocuments(),
      db.collection('payments').countDocuments(),
      db.collection('invoices').countDocuments(),
      db.collection('drivers').countDocuments(),
      db.collection('clients').countDocuments(),
    ]);

    return ok({
      ok: true,
      totals: { reservations, quotes, payments, invoices, drivers, clients },
    }, corsHeaders);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message, corsHeaders);
    return serverError(error, corsHeaders);
  }
};
