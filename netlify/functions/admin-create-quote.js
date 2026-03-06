const { buildCorsHeaders, handleOptions } = require('./utils/cors');
const { ok, badRequest, unauthorized, methodNotAllowed, serverError } = require('./utils/response');
const { verifyAdminTokenFromEvent } = require('./utils/auth');
const { getDb } = require('./utils/db');
const { parseJsonBody, requireFields } = require('./utils/validators');

exports.handler = async (event) => {
  const corsHeaders = buildCorsHeaders(event.headers?.origin || event.headers?.Origin || '');

  try {
    if (event.httpMethod === 'OPTIONS') return handleOptions(event);
    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST'], corsHeaders);
    verifyAdminTokenFromEvent(event);

    const body = parseJsonBody(event);
    requireFields(body, ['clientName', 'email', 'amount']);

    const db = await getDb();
    const doc = {
      clientName: String(body.clientName).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: body.phone ? String(body.phone).trim() : '',
      trip: body.trip || '',
      amount: Number(body.amount),
      currency: body.currency || 'EUR',
      status: body.status || 'draft',
      notes: body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('quotes').insertOne(doc);
    return ok({ ok: true, id: result.insertedId, quote: doc }, corsHeaders);
  } catch (error) {
    if (error.statusCode === 401) return unauthorized(error.message, corsHeaders);
    if (error.message?.startsWith('Champ requis') || error.message === 'JSON invalide') return badRequest(error.message, corsHeaders);
    return serverError(error, corsHeaders);
  }
};
