const { supa } = require("./_supabase");
const { corsHeaders, requireAdmin } = require("./_utils");

exports.handler = async (event) => {
  const origin = event.headers.origin;
  const headers = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: JSON.stringify({ ok:true }) };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ ok:false, error:"Method Not Allowed" }) };

  const gate = requireAdmin(event, headers);
  if (!gate.ok) return gate.res;

  try {
    const body = JSON.parse(event.body || "{}");
    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim();
    if (!id || !status) return { statusCode: 400, headers, body: JSON.stringify({ ok:false, error:"Missing id/status" }) };

    const db = supa();
    const { data, error } = await db.from("reservations").update({ status }).eq("id", id).select("*").single();
    if (error) return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: error.message }) };

    return { statusCode: 200, headers, body: JSON.stringify({ ok:true, row: data }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok:false, error: e.message || "Server error" }) };
  }
};
