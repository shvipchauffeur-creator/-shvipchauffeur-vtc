const Stripe = require("stripe");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
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

function euro(n) {
  return (Number(n || 0)).toFixed(2).replace(".", ",") + " €";
}

function assertAdmin(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) throw new Error("Missing ADMIN_TOKEN");
  if (!token || token !== expected) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
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
    // ✅ Sécurité admin
    assertAdmin(event);

    const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });

    const body = JSON.parse(event.body || "{}");
    const sessionId = String(body.session_id || "").trim();
    if (!sessionId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "session_id manquant." }) };
    }

    // ✅ Récupère la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "customer_details"],
    });

    const paymentStatus = session.payment_status; // "paid" attendu
    if (paymentStatus !== "paid") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Session non payée (payment_status=${paymentStatus}).` }),
      };
    }

    const customerEmail =
      session.customer_details?.email || session.customer_email || session.metadata?.customer_email;
    const customerName =
      session.customer_details?.name || session.metadata?.customer_name || "";
    if (!customerEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Email client introuvable sur la session." }) };
    }

    const quoteId = session.metadata?.quote_id || "Q-UNKNOWN";
    const description = session.metadata?.description || "Prestation Chauffeur Privé";
    const totalEur = Number(session.metadata?.total_amount_eur || 0);
    const paidEur =
      Number(session.metadata?.paid_amount_eur || 0) ||
      (session.amount_total ? session.amount_total / 100 : 0);

    const payMode = session.metadata?.pay_mode || "";
    const type = session.metadata?.type || "";

    // ✅ Email SMTP (Brevo)
    const transporter = nodemailer.createTransport({
      host: getEnv("SMTP_HOST"),
      port: Number(getEnv("SMTP_PORT")),
      secure: false,
      auth: { user: getEnv("SMTP_USER"), pass: getEnv("SMTP_PASS") },
    });

    const EMAIL_FROM = getEnv("EMAIL_FROM");
    const EMAIL_ADMIN = getEnv("EMAIL_ADMIN");

    // ✅ Référence facture
    const invoiceId = `F-${Date.now()}`;

    // ✅ PDF Facture
    const pdf = await pdfToBuffer((doc) => {
      doc.fontSize(20).text("FACTURE — SHVIP", { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Référence facture : ${invoiceId}`);
      doc.text(`Devis lié : ${quoteId}`);
      doc.text(`Date : ${new Date().toLocaleString("fr-FR")}`);
      doc.moveDown();

      doc.fontSize(12).text("Client");
      doc.fontSize(11).text(customerName ? customerName : "(non renseigné)");
      doc.text(customerEmail);

      doc.moveDown();
      doc.fontSize(12).text("Détails");
      doc.fontSize(11).text(description);

      doc.moveDown();
      doc.fontSize(12).text("Paiement");
      doc.fontSize(11).text(`Mode : ${payMode || "-"} / Type : ${type || "-"}`);
      if (totalEur) doc.text(`Total devis : ${euro(totalEur)}`);
      doc.text(`Payé : ${euro(paidEur)}`);
      doc.text(`Stripe session : ${session.id}`);

      doc.moveDown(2);
      doc.fontSize(10).text("SHVIP — Chauffeur Privé Premium • Paris & Île-de-France");
    });

    const subject = `SHVIP — Facture ${invoiceId} (renvoi)`;
    const html = `
      <p>Bonjour${customerName ? " " + customerName : ""},</p>
      <p>Voici le <b>renvoi de votre facture</b> (paiement confirmé ✅).</p>
      <p>Merci,<br/>SHVIP</p>
    `;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: customerEmail,
      cc: EMAIL_ADMIN,
      subject,
      html,
      attachments: [{ filename: `facture-${invoiceId}.pdf`, content: pdf }],
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        invoice_id: invoiceId,
        session_id: session.id,
        email: customerEmail,
      }),
    };
  } catch (err) {
    const statusCode = err?.statusCode || 500;
    return {
      statusCode,
      headers: corsHeaders(),
      body: JSON.stringify({ error: err?.message || "Server error" }),
    };
  }
};