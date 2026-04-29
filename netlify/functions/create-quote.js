const crypto = require("crypto");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const Stripe = require("stripe");

/**
 * SHVIP — create-quote
 * - Auth double voie :
 *    • ADMIN_TOKEN  → panel admin (Bearer token ou X-Admin-Token)
 *    • PUBLIC_FORM_SECRET → formulaire public (header X-Form-Secret)
 * - Accepts both payload formats:
 *    NEW: { customerEmail, customerName, description, mode, totalAmount, acomptePercent, libreAmount }
 *    ADMIN FORM: { customerEmail, customerName, from, to, datetime, vehicleType, passengers, notes, pricingMode, amount, depositAmount }
 * - Anti double-send:
 *    - Stripe idempotencyKey derived from quoteId
 *    - In-memory cache (warm instances) to avoid re-sending email for same quoteId
 */

const ALLOWED_ORIGIN = process.env.SITE_URL || "https://shvipchauffeur-vtc.netlify.app";

// Warm instance cache to prevent duplicate emails for the same quoteId in short time
const sentCache = global.__SHVIP_SENT_CACHE__ || (global.__SHVIP_SENT_CACHE__ = new Map());

function nowMs() { return Date.now(); }
function cacheHasFresh(key, ttlMs = 10 * 60 * 1000) { // 10 min
  const v = sentCache.get(key);
  if (!v) return false;
  if (nowMs() - v > ttlMs) { sentCache.delete(key); return false; }
  return true;
}
function cacheMark(key) { sentCache.set(key, nowMs()); }

function corsHeaders(origin) {
  const ok = origin && origin === ALLOWED_ORIGIN;
  return {
    ...(ok ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token, X-Form-Secret, Idempotency-Key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function unauthorized(headers) {
  return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
}

function requireAuth(event, headers) {
  const adminToken   = process.env.ADMIN_TOKEN;
  const publicSecret = process.env.PUBLIC_FORM_SECRET;

  // ── Voie 1 : admin panel (Bearer / X-Admin-Token / ?token=)
  if (adminToken) {
    const auth    = event.headers?.authorization || event.headers?.Authorization || "";
    const xToken  = event.headers?.["x-admin-token"] || event.headers?.["X-Admin-Token"] || "";
    const qsToken = event.queryStringParameters?.token || "";
    let token = "";
    if (auth)         token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();
    else if (xToken)  token = String(xToken).trim();
    else if (qsToken) token = String(qsToken).trim();
    if (token && token === adminToken) return { ok: true, via: "admin" };
  }

  // ── Voie 2 : formulaire public (header X-Form-Secret)
  if (publicSecret) {
    const formSecret = event.headers?.["x-form-secret"] || event.headers?.["X-Form-Secret"] || "";
    if (String(formSecret).trim() === publicSecret) return { ok: true, via: "public" };
  }

  // Aucun secret configuré = erreur de config
  if (!adminToken && !publicSecret) {
    return {
      ok: false,
      res: { statusCode: 500, headers, body: JSON.stringify({ error: "Missing ADMIN_TOKEN and PUBLIC_FORM_SECRET" }) },
    };
  }

  return { ok: false, res: unauthorized(headers) };
}

function mustEnv(name) {
  const v = process.env[name];
  if (!v) {
    const err = new Error(`Missing ${name}`);
    err.code = "MISSING_ENV";
    err.env = name;
    throw err;
  }
  return v;
}

function euro(n) {
  return (Number(n || 0)).toFixed(2).replace(".", ",") + " €";
}

function pdfToBuffer(buildFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    buildFn(doc);
    doc.end();
  });
}

function buildDescription(body) {
  const parts = [];
  if (body.from) parts.push(`Départ: ${body.from}`);
  if (body.to) parts.push(`Arrivée: ${body.to}`);
  if (body.datetime) parts.push(`Date/Heure: ${body.datetime}`);
  if (body.vehicleType) parts.push(`Véhicule: ${body.vehicleType}`);
  if (body.passengers) parts.push(`Passagers: ${body.passengers}`);
  if (body.customerPhone) parts.push(`Téléphone: ${body.customerPhone}`);
  if (body.notes) parts.push(`Notes: ${body.notes}`);
  return parts.join(" | ");
}

function stableQuoteId(payload) {
  // Deterministic id from key fields => prevents duplicates if request is retried
  const base = JSON.stringify({
    customerEmail: payload.customerEmail || "",
    customerName: payload.customerName || "",
    amountToPay: payload.amountToPay || 0,
    totalAmount: payload.totalAmount || 0,
    mode: payload.mode || "",
    description: payload.description || "",
  });
  const hash = require("crypto").createHash("sha256").update(base).digest("hex").slice(0, 12);
  return `Q-${hash}`;
}

function parsePayload(body) {
  // Normalize fields from multiple front formats
  const customerEmail = String(body.customerEmail || body.email || "").trim();
  const customerName = String(body.customerName || body.name || "").trim();

  // Admin form: amount + pricingMode + depositAmount
  const pricingMode = String(body.pricingMode || body.mode || "total").toLowerCase();
  const amount = Number(body.amount ?? body.totalAmount ?? body.total_amount ?? 0);
  const depositAmount = Number(body.depositAmount ?? body.acompteAmount ?? body.deposit_amount ?? 0);

  let mode = "total";
  let totalAmount = amount;
  let amountToPay = amount;

  if (pricingMode === "deposit" || pricingMode === "acompte") {
    mode = "acompte";
    if (depositAmount > 0) amountToPay = depositAmount;
    else amountToPay = Math.round(amount * 0.3); // fallback 30%
  } else if (pricingMode === "libre") {
    mode = "libre";
    amountToPay = Number(body.libreAmount || body.amountToPay || amount);
    totalAmount = amount > 0 ? amount : amountToPay;
  } else {
    mode = "total";
    amountToPay = amount;
    totalAmount = amount;
  }

  const description = String(body.description || buildDescription(body) || "Prestation Chauffeur Privé").trim();

  return {
    customerEmail,
    customerName,
    description,
    mode,
    totalAmount,
    amountToPay,
    raw: body
  };
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  const headers = corsHeaders(origin);

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

  const gate = requireAuth(event, headers);
  if (!gate.ok) return gate.res;

  try {
    const body = JSON.parse(event.body || "{}");
    const p = parsePayload(body);

    if (!p.customerEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Email client manquant.", details: "customerEmail est obligatoire." }) };
    }
    if (!Number.isFinite(p.totalAmount) || p.totalAmount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Montant total invalide.", details: "amount/totalAmount doit être > 0." }) };
    }
    if (!Number.isFinite(p.amountToPay) || p.amountToPay <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Montant à payer invalide.", details: "depositAmount/amountToPay doit être > 0." }) };
    }

    // --- ENV (SMTP) ---
    const SMTP_HOST = mustEnv("SMTP_HOST");
    const SMTP_PORT = Number(mustEnv("SMTP_PORT"));
    const SMTP_USER = mustEnv("SMTP_USER");
    const SMTP_PASS = mustEnv("SMTP_PASS");
    const EMAIL_FROM = mustEnv("EMAIL_FROM");
    const EMAIL_ADMIN = mustEnv("EMAIL_ADMIN");

    // --- Stripe ---
    const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const SITE_URL = process.env.SITE_URL || "https://shvipchauffeur-vtc.netlify.app";

    // Idempotency key (prefer header, else stable quoteId)
    const reqIdem =
      event.headers?.["idempotency-key"] ||
      event.headers?.["Idempotency-Key"] ||
      "";
    const quoteId = stableQuoteId(p);
    const idemKey = (reqIdem ? String(reqIdem).trim() : quoteId);

    // If we've already sent email for this quoteId recently, don't resend
    const alreadySent = cacheHasFresh(quoteId);

    // Create Stripe session idempotently
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: p.customerEmail,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: `SHVIP — Paiement ${p.mode === "total" ? "Total" : p.mode === "acompte" ? "Acompte" : "Libre"}`,
                description: `Devis ${quoteId} — ${p.description}`,
              },
              unit_amount: Math.round(Number(p.amountToPay) * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${SITE_URL}/paiement-succes.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/paiement-annule.html`,
        metadata: {
          quote_id: quoteId,
          customer_name: p.customerName || "",
          customer_email: p.customerEmail,
          description: p.description,
          total_amount_eur: String(p.totalAmount),
          paid_amount_eur: String(p.amountToPay),
          pay_mode: p.mode,
          type: p.mode === "total" ? "solde" : "acompte",
          source: "shvip-site",
        },
      },
      { idempotencyKey: idemKey }
    );

    // Send email only once (best-effort)
    if (!alreadySent) {
      const pdf = await pdfToBuffer((doc) => {
        doc.fontSize(20).text("DEVIS — SHVIP", { align: "left" });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Référence devis : ${quoteId}`);
        doc.text(`Date : ${new Date().toLocaleString("fr-FR")}`);
        doc.moveDown();

        doc.fontSize(12).text("Client");
        doc.fontSize(11).text(p.customerName ? p.customerName : "(non renseigné)");
        doc.text(p.customerEmail);

        doc.moveDown();
        doc.fontSize(12).text("Détails");
        doc.fontSize(11).text(p.description);

        doc.moveDown();
        doc.fontSize(12).text("Montants");
        doc.fontSize(11).text(`Total : ${euro(p.totalAmount)}`);
        doc.text(`Paiement demandé (${p.mode}) : ${euro(p.amountToPay)}`);

        doc.moveDown();
        doc.fontSize(11).text("Lien de paiement sécurisé :", { underline: true });
        doc.fillColor("blue").text(session.url);
        doc.fillColor("black");

        doc.moveDown(2);
        doc.fontSize(10).text("SHVIP — Chauffeur Privé Premium • Paris & Île-de-France");
      });

      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      const subject = `SHVIP — Votre devis ${quoteId}`;
      const html = `
        <p>Bonjour${p.customerName ? " " + p.customerName : ""},</p>
        <p>Veuillez trouver votre <b>devis SHVIP</b> en pièce jointe.</p>
        <p><b>Paiement sécurisé :</b> <a href="${session.url}">Payer en ligne</a></p>
        <p>Merci,<br/>SHVIP</p>
      `;

      await transporter.sendMail({
        from: EMAIL_FROM,
        to: p.customerEmail,
        cc: EMAIL_ADMIN,
        subject,
        html,
        attachments: [{ filename: `devis-${quoteId}.pdf`, content: pdf }],
      });

      cacheMark(quoteId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        quote_id: quoteId,
        pay_url: session.url,
        amount_to_pay: p.amountToPay,
        total_amount: p.totalAmount,
        mode: p.mode,
        email_sent: !alreadySent,
      }),
    };
  } catch (err) {
    console.error("[create-quote] error:", err);
    const msg = err?.message ? String(err.message) : String(err);
    const details =
      err?.code === "MISSING_ENV"
        ? `Variable Netlify manquante: ${err.env}`
        : msg;

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", details }),
    };
  }
};
