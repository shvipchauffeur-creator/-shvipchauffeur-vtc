const Stripe = require("stripe");
const { corsHeaders, requireAdmin, mustEnv } = require("./_utils");

function isPaidSession(s) {
  return s && (s.payment_status === "paid" || s.status === "complete");
}

function invoiceIdFromSession(s) {
  // Stable-ish id: F-YYYYMMDD-<last6>
  const d = new Date((s.created || Math.floor(Date.now()/1000)) * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const da = String(d.getDate()).padStart(2,'0');
  const tail = String(s.id || "").slice(-6).toUpperCase();
  return `F-${y}${m}${da}-${tail}`;
}

exports.handler = async (event) => {
  const origin = event.headers.origin;
  const headers = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

  const gate = requireAdmin(event, headers);
  if (!gate.ok) return gate.res;

  try {
    const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const sessions = await stripe.checkout.sessions.list({ limit: 200 });

    const rows = sessions.data
      .filter(isPaidSession)
      .map(s => ({
        invoice_id: invoiceIdFromSession(s),
        session_id: s.id,
        created: s.created,
        email: s.customer_details?.email || s.customer_email || s.metadata?.customer_email || s.metadata?.email || "",
        description: s.metadata?.description || "",
        amount_eur: s.amount_total ? s.amount_total / 100 : 0,
        payment_status: s.payment_status || "",
        quote_id: s.metadata?.quote_id || "",
      }));

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, rows, count: rows.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error", details: err.message }) };
  }
};