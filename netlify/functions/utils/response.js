function json(statusCode, body = {}, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

function ok(data = {}, headers = {}) {
  return json(200, data, headers);
}

function badRequest(message = 'Requête invalide', headers = {}) {
  return json(400, { ok: false, error: message }, headers);
}

function unauthorized(message = 'Non autorisé', headers = {}) {
  return json(401, { ok: false, error: message }, headers);
}

function forbidden(message = 'Accès refusé', headers = {}) {
  return json(403, { ok: false, error: message }, headers);
}

function methodNotAllowed(allowed = ['GET'], headers = {}) {
  return json(405, { ok: false, error: 'Méthode non autorisée', allowed }, headers);
}

function serverError(error, headers = {}) {
  console.error('[SERVER_ERROR]', error);
  return json(500, { ok: false, error: error?.message || 'Erreur serveur' }, headers);
}

module.exports = {
  json,
  ok,
  badRequest,
  unauthorized,
  forbidden,
  methodNotAllowed,
  serverError,
};
