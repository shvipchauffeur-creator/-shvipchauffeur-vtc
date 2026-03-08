// netlify/functions/create-checkout-session.js
// ─────────────────────────────────────────────
// Fonction Stripe pour S.H.vip — version corrigée
// Sans dépendance jsonwebtoken
// ─────────────────────────────────────────────

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Preflight OPTIONS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Méthode non autorisée" }),
    };
  }

  try {
    // Vérifier que la clé Stripe est configurée
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Clé Stripe manquante dans les variables d'environnement Netlify.");
    }

    const body = JSON.parse(event.body || "{}");
    const amount = Number(body.amount || 0);
    const type   = String(body.type || "acompte").toLowerCase();

    // Validation
    if (!amount || amount < 20) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Montant invalide (minimum 20€)." }),
      };
    }

    // Label du paiement
    const label = type === "solde"
      ? "Solde — Course S.H.vip Chauffeur Privé"
      : "Acompte — Course S.H.vip Chauffeur Privé";

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: label,
              description: "S.H.vip — Maison Privée de Chauffeurs · Paris",
            },
            unit_amount: Math.round(amount * 100), // en centimes
          },
          quantity: 1,
        },
      ],
      success_url: process.env.URL + "/paiement-succes.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:  process.env.URL + "/paiement-annule.html",
      metadata: {
        type:    type,
        montant: amount.toString(),
        source:  "shvip-site",
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error("Stripe error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Erreur serveur Stripe." }),
    };
  }
};
