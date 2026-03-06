const { supa } = require("./_supabase");
const { corsHeaders } = require("./_utils");

exports.handler = async (event) => {
  const origin = event.headers.origin;
  const headers = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: JSON.stringify({ ok:true }) };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ ok:false, error:"Method Not Allowed" }) };

  try {
    const body = JSON.parse(event.body || "{}");
    // Honeypot anti-spam (optional field)
    if (body.website) return { statusCode: 200, headers, body: JSON.stringify({ ok:true }) };

    const payload = {
      client_name: String(body.client_name || "").trim(),
      client_email: String(body.client_email || "").trim(),
      client_phone: String(body.client_phone || "").trim(),
      pickup: String(body.pickup || "").trim(),
      dropoff: String(body.dropoff || "").trim(),
      datetime: String(body.datetime || "").trim(),
      vehicle: String(body.vehicle || "berline").trim(),
      price_eur: Number(body.price_eur || 0),
      notes: String(body.notes || "").trim(),
      payment_status: "unpaid",
      status: "pending"
    };

    if (!payload.client_name || !payload.client_email || !payload.pickup || !payload.dropoff || !payload.datetime) {
      return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"Champs requis manquants." }) };
    }

    const db = supa();
    const { data, error } = await db.from("reservations").insert([payload]).select("id").single();
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: error.message }) };

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, id: data.id }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message || "Server error" }) };
  }
};
