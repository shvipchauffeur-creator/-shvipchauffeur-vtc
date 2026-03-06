const { ObjectId } = require('mongodb');
const { buildCorsHeaders, handleOptions } = require('./utils/cors');
const { ok, badRequest, unauthorized, methodNotAllowed, serverError } = require('./utils/response');
const { verifyAdminTokenFromEvent } = require('./utils/auth');
const { getDb } = require('./utils/db');
const { parseJsonBody, requireFields } = require('./utils/validators');

exports.handler = async (event) => {
  const corsHeaders = buildCorsHeaders(event.headers?.origin || event.headers?.Origin || '');

  try {
    if (event.httpMethod === 'OPTIONS') return handleOptions(event);
    if (!['PATCH', 'POST'].includes(event.httpMethod)) return methodNotAllowed(['PATCH', 'POST'], corsHeaders);
    verifyAdminTokenFromEvent(event);

    const body = parseJsonBody(event);
    requireFields(body, ['id', 'status']);

    const db = await getDb();
    const result = await db.collection('reservations').updateOne(
      { _id: new ObjectId(body.id) },
      { $set: { status: body.status, updatedAt: new Date() } }
    );

    if (!result.matchedCount) return badRequest('Réservation introuvable', corsHeaders);
    return ok({ ok: true, updated: true }, corsHeaders);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message, corsHeaders);
    if (error.message?.includes('input must be')) return badRequest('ID invalide', corsHeaders);
    if (error.message?.startsWith('Champ requis') || error.message === 'JSON invalide') return badRequest(error.message, corsHeaders);
    return serverError(error, corsHeaders);
  }
};
