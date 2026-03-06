const Stripe = require("stripe");
const { corsHeaders, requireAdmin, mustEnv } = require("./_utils");

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

    // Quotes are sessions created by create-quote (they have quote_id)
    const quotes = sessions.data
      .filter(s => s.metadata && s.metadata.quote_id)
      .map(s => ({
        quote_id: s.metadata.quote_id,
        session_id: s.id,
        created: s.created,
        customer_name: s.metadata.customer_name || "",
        customer_email: s.metadata.customer_email || s.customer_details?.email || s.customer_email || "",
        description: s.metadata.description || "",
        total_amount_eur: Number(s.metadata.total_amount_eur || 0),
        paid_amount_eur: Number(s.metadata.paid_amount_eur || 0) || (s.amount_total ? s.amount_total / 100 : 0),
        pay_mode: s.metadata.pay_mode || "",
        payment_status: s.payment_status || "",
      }));

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, rows: quotes, count: quotes.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server error", details: err.message }) };
  }
};