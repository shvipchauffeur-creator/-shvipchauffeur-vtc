async function payer(type, amount) {
  const res = await fetch("/.netlify/functions/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, amount }),
  });

  const raw = await res.text(); // <= on lit toujours du texte d'abord
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("Réponse NON JSON :", raw);
    throw new Error("Réponse non valide (JSON attendu).");
  }

  if (!res.ok) {
    throw new Error(data.error || "Erreur serveur");
  }

  if (!data.url) {
    throw new Error("URL Stripe non reçue.");
  }

  window.location.href = data.url;
}