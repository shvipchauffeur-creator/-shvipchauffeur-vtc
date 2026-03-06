// netlify/functions/stripe-webhook.js
const Stripe = require("stripe");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function getEnv(name, { optional = false } = {}) {
  const v = process.env[name];
  if (!v && !optional) throw new Error(`Missing ${name}`);
  return v;
}

function euro(n) {
  const x = Number(n || 0);
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(x);
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

function buildReceiptPDF({ ref, createdAt, customerEmail, customerName, description, totalEur, paidEur, payMode }) {
  return pdfToBuffer((doc) => {
    doc.fontSize(20).text("REÇU DE PAIEMENT — SHVIP", { align: "left" });
    doc.moveDown(0.5);

    doc.fontSize(11).text(`Référence : ${ref}`);
    doc.text(`Date : ${new Date(createdAt).toLocaleString("fr-FR")}`);
    doc.moveDown();

    doc.fontSize(12).text("Client");
    doc.fontSize(11).text(customerName || "(non renseigné)");
    doc.text(customerEmail || "—");
    doc.moveDown();

    doc.fontSize(12).text("Détails");
    doc.fontSize(11).text(description || "Paiement SHVIP");
    doc.moveDown();

    doc.fontSize(12).text("Montants");
    doc.fontSize(11).text(`Total : ${euro(totalEur)}`);
    doc.text(`Payé : ${euro(paidEur)} (${String(payMode || "—")})`);

    doc.moveDown(2);
    doc.fontSize(10).text("SHVIP — Chauffeur Privé Premium • Paris & Île-de-France");
  });
}

async function sendMailWithSMTP({ to, cc, subject, html, attachments }) {
  const SMTP_HOST = getEnv("SMTP_HOST");
  const SMTP_PORT = Number(getEnv("SMTP_PORT"));
  const SMTP_USER = getEnv("SMTP_USER");
  const SMTP_PASS = getEnv("SMTP_PASS");
  const EMAIL_FROM = getEnv("EMAIL_FROM");

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // Gmail: 465 = true, 587 = false
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    cc,
    subject,
    html,
    attachments,
  });
}

exports.handler = async (event) => {
  const headers = corsHeaders();

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });
    const webhookSecret = getEnv("STRIPE_WEBHOOK_SECRET");

    // IMPORTANT: Stripe envoie un RAW body (string). Netlify donne event.body (string).
    const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
    if (!sig) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing Stripe-Signature header" }) };
    }

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
    } catch (err) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid signature", details: err?.message }) };
    }

    // On traite seulement checkout.session.completed
    if (stripeEvent.type !== "checkout.session.completed") {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ignored: stripeEvent.type }) };
    }

    const session = stripeEvent.data.object;

    // Récupère infos utiles (metadata posée dans create-checkout-session / create-quote)
    const md = session.metadata || {};
    const customerEmail = session.customer_details?.email || session.customer_email || md.customer_email || "";
    const customerName = session.customer_details?.name || md.customer_name || "";
    const description = md.description || session.description || "Paiement SHVIP";
    const totalEur = Number(md.total_amount_eur || md.amount_eur || 0) || (Number(session.amount_total || 0) / 100);
    const paidEur = Number(md.paid_amount_eur || 0) || (Number(session.amount_total || 0) / 100);
    const payMode = md.pay_mode || md.type || "payment";
    const ref =
      md.quote_id ||
      md.order_id ||
      session.id ||
      `SHVIP-${Date.now()}`;

    // Si pas d’email client → on envoie seulement à l’admin (si configuré)
    const EMAIL_ADMIN = getEnv("EMAIL_ADMIN", { optional: true });

    // Construit PDF reçu
    const pdf = await buildReceiptPDF({
      ref,
      createdAt: (session.created || Math.floor(Date.now() / 1000)) * 1000,
      customerEmail,
      customerName,
      description,
      totalEur,
      paidEur,
      payMode,
    });

    // Envoie email (si SMTP configuré)
    // Si SMTP_* manquantes, on ne fait PAS échouer le webhook (sinon Stripe retry en boucle)
    try {
      const subject = `SHVIP — Reçu de paiement (${ref})`;
      const html = `
        <p>Bonjour${customerName ? " " + customerName : ""},</p>
        <p>Merci pour votre paiement SHVIP.</p>
        <p><b>Référence :</b> ${ref}<br/>
           <b>Montant payé :</b> ${euro(paidEur)}<br/>
           <b>Description :</b> ${description}</p>
        <p>Vous trouverez le reçu en pièce jointe.</p>
        <p>SHVIP — Chauffeur Privé Premium</p>
      `;

      const attachments = [{ filename: `recu-${ref}.pdf`, content: pdf }];

      // Client
      if (customerEmail) {
        await sendMailWithSMTP({
          to: customerEmail,
          cc: EMAIL_ADMIN || undefined,
          subject,
          html,
          attachments,
        });
      } else if (EMAIL_ADMIN) {
        // Admin only
        await sendMailWithSMTP({
          to: EMAIL_ADMIN,
          subject: `[CLIENT EMAIL MANQUANT] ${subject}`,
          html: `<p>Client email manquant. Reçu en PJ.</p>` + html,
          attachments,
        });
      }
    } catch (mailErr) {
      // On log seulement, on répond 200 pour éviter les retries Stripe
      console.error("Email send failed:", mailErr?.message || mailErr);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    // 500 = Stripe retry. Ici on garde 500 si c’est une vraie erreur serveur (signature ok mais crash)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error", details: err?.message || String(err) }),
    };
  }
};