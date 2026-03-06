const { buildCorsHeaders, handleOptions } = require('./utils/cors');
const { ok, badRequest, unauthorized, methodNotAllowed, serverError } = require('./utils/response');
const { parseJsonBody, requireFields } = require('./utils/validators');
const { verifyPassword } = require('./utils/password');
const { signAdminToken } = require('./utils/auth');

exports.handler = async (event) => {
  const corsHeaders = buildCorsHeaders(event.headers?.origin || event.headers?.Origin || '');

  try {
    if (event.httpMethod === 'OPTIONS') return handleOptions(event);
    if (event.httpMethod !== 'POST') return methodNotAllowed(['POST'], corsHeaders);

    const body = parseJsonBody(event);
    requireFields(body, ['email', 'password']);

    const expectedEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!expectedEmail || !passwordHash) {
      return serverError(new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD_HASH'), corsHeaders);
    }

    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password || '');

    if (email !== expectedEmail) {
      return unauthorized('Identifiants invalides', corsHeaders);
    }

    const validPassword = await verifyPassword(password, passwordHash);
    if (!validPassword) {
      return unauthorized('Identifiants invalides', corsHeaders);
    }

    const token = signAdminToken({ role: 'admin', email });
    return ok({ ok: true, token, admin: { email, role: 'admin' } }, corsHeaders);
  } catch (error) {
    if (error.message?.startsWith('Champ requis')) return badRequest(error.message, corsHeaders);
    if (error.message === 'JSON invalide') return badRequest(error.message, corsHeaders);
    return serverError(error, corsHeaders);
  }
};
