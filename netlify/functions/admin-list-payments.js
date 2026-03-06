const Stripe = require("stripe");

const ALLOWED_ORIGIN =
  process.env.SITE_URL || "https://shvipchauffeur-vtc.netlify.app";

function corsHeaders(origin) {
  if (!origin || origin !== ALLOWED_ORIGIN) {
    return { "Content-Type": "application/json" };
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };
}

function requireAdmin(event, headers) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return {
      ok: false,
      res: { statusCode: 500, headers, body: JSON.stringify({ error: "Missing ADMIN_TOKEN" }) },
    };
  }

  // Authorization: Bearer xxx (case-insensitive)
  const auth =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    "";

  let token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();

  // Option: X-Admin-Token (pratique si besoin)
  if (!token) {
    token =
      (event.headers?.["x-admin-token"] ||
        event.headers?.["X-Admin-Token"] ||
        "").trim();
  }

  // Option: ?token=... (uniquement pour debug)
  if (!token) {
    token = (event.queryStringParameters?.token || "").trim();
  }

  if (!token || token !== expected) {
    return {
      ok: false,
      res: { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) },
    };
  }

  return { ok: true };
}

exports.handler = async (event) => {
  const origin = event.headers.origin;
  const headers = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const gate = requireAdmin(event, headers);
  if (!gate.ok) return gate.res;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const sessions = await stripe.checkout.sessions.list({ limit: 50 });

    const rows = sessions.data.map((s) => ({
      session_id: s.id,
      email: s.customer_email || "",
      created: s.created,
      amount_eur: s.amount_total ? s.amount_total / 100 : 0,
      type: s.metadata?.type || "",
      status: s.payment_status || "",
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        rows,
        count: rows.length,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", details: err.message }),
    };
  }
};