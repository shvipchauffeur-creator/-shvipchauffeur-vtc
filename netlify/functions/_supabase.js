const { createClient } = require("@supabase/supabase-js");

function supa() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing SUPABASE_URL environment variable");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  return createClient(url, key, { auth: { persistSession: false } });
}

module.exports = { supa };
