const { supabase } = require("./utils/supabase");

exports.handler = async () => {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .limit(1);

    if (error) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: error.message
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        message: "Supabase connecté",
        sample: data || []
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};