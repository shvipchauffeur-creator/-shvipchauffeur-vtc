const ALLOWED_ORIGIN = process.env.SITE_URL || "https://shvipchauffeur-vtc.netlify.app";

function corsHeaders(origin) {
  const base = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
  if (!origin) return base;
  const allowed =
    origin === ALLOWED_ORIGIN ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.includes("netlify.app");
  if (allowed) return { ...base, "Access-Control-Allow-Origin": origin };
  return base;
}

function requireAdmin(event, headers) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return { ok: false, res: { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: "Missing ADMIN_TOKEN env variable." }) } };
  }
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const xToken = event.headers?.["x-admin-token"] || event.headers?.["X-Admin-Token"] || "";
  const qsToken = event.queryStringParameters?.token || "";
  let token = "";
  if (auth) token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();
  else if (xToken) token = String(xToken).trim();
  else if (qsToken) token = String(qsToken).trim();
  if (!token || token !== expected) {
    return { ok: false, res: { statusCode: 401, headers, body: JSON.stringify({ ok: false, error: "Unauthorized" }) } };
  }
  return { ok: true };
}

function mustEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error("Missing environment variable: " + name);
    err.code = "MISSING_ENV";
    err.env = name;
    throw err;
  }
  return v;
}

module.exports = { corsHeaders, requireAdmin, mustEnv };
