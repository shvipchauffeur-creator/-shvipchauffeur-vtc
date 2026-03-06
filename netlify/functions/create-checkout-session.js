const Stripe = require("stripe");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "STRIPE_SECRET_KEY manquante." }) };
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });

    const data = JSON.parse(event.body || "{}");

    const type = String(data.type || "").toLowerCase(); // "acompte" | "solde"
    const amountEuro = Number(data.amount);

    // ✅ email optionnel (mais utile pour l'email automatique)
    const emailRaw = data.email ? String(data.email).trim() : "";
    const email = emailRaw && isValidEmail(emailRaw) ? emailRaw : null;

    if (!["acompte", "solde"].includes(type)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Type invalide (acompte/solde)." }) };
    }

    if (!Number.isFinite(amountEuro) || amountEuro <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Montant invalide." }) };
    }

    const min = 20;
    const max = type === "acompte" ? 5000 : 20000;
    if (amountEuro < min || amountEuro > max) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Montant hors limites (${min}€ - ${max}€).` }) };
    }

    const successUrl =
      process.env.STRIPE_SUCCESS_URL ||
      "https://shvipchauffeur-vtc.netlify.app/paiement-succes.html?session_id={CHECKOUT_SESSION_ID}";
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ||
      "https://shvipchauffeur-vtc.netlify.app/paiement-annule.html";

    const unitAmount = Math.round(amountEuro * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      // ✅ Stripe affichera/collectera l'email.
      // Et si tu le fournis, Stripe le pré-remplit.
      ...(email ? { customer_email: email } : {}),

      // ✅ optionnel : collecte tel (utile VTC)
      phone_number_collection: { enabled: true },

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: type === "acompte" ? "Acompte réservation SHVIP" : "Solde réservation SHVIP",
              description: "Paiement sécurisé via Stripe",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],

      success_url: successUrl,
      cancel_url: cancelUrl,

      // ✅ On stocke toujours dans metadata (même si email vide)
      metadata: {
        type,
        amount_eur: String(amountEuro),
        source: "shvip-site",
        email: email || "",
      },
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erreur serveur Stripe/Netlify",
        details: err?.message || String(err),
      }),
    };
  }
};