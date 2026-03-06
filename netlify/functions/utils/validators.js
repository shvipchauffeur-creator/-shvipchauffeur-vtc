function parseJsonBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error('JSON invalide');
  }
}

function requireFields(body, fields = []) {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw new Error(`Champ requis manquant : ${field}`);
    }
  }
}

function toPositiveInt(value, fallback = 20, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

module.exports = {
  parseJsonBody,
  requireFields,
  toPositiveInt,
};
