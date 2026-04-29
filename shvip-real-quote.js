exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Méthode non autorisée' })
    };
  }

  try {
    const { pickup, dropoff, vehicle } = JSON.parse(event.body || '{}');

    if (!pickup || !dropoff || !vehicle) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'pickup, dropoff et vehicle sont requis.' })
      };
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Clé GOOGLE_MAPS_API_KEY manquante dans les variables d’environnement.' })
      };
    }

    const vehiclePricing = {
      E: { base: 24, perKm: 2.65, perMin: 0.95 },
      S: { base: 36, perKm: 3.95, perMin: 1.35 },
      V: { base: 28, perKm: 3.05, perMin: 1.05 }
    };

    if (!vehiclePricing[vehicle]) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, error: 'Véhicule inconnu.' })
      };
    }

    const body = {
      origin: { address: pickup },
      destination: { address: dropoff },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      languageCode: 'fr-FR',
      units: 'METRIC'
    };

    const googleRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.localizedValues'
      },
      body: JSON.stringify(body)
    });

    const googleJson = await googleRes.json();

    if (!googleRes.ok || !googleJson.routes || !googleJson.routes.length) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: false,
          error: googleJson.error?.message || 'Aucun itinéraire trouvé via Google Routes.'
        })
      };
    }

    const route = googleJson.routes[0];
    const distanceMeters = route.distanceMeters || 0;
    const durationSeconds = Number(String(route.duration || '0s').replace('s', '')) || 0;

    const distanceKm = distanceMeters / 1000;
    const durationMin = durationSeconds / 60;

    const p = vehiclePricing[vehicle];
    let total = p.base + (distanceKm * p.perKm) + (durationMin * p.perMin);

    // Exemples de majorations simples à adapter.
    const nightHours = false; // Tu peux brancher ici une logique selon l'heure demandée.
    if (nightHours) total *= 1.15;

    total = Math.round(total);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        total,
        distanceKm: Number(distanceKm.toFixed(1)),
        durationMin: Math.round(durationMin),
        distanceText: `${distanceKm.toFixed(1)} km`,
        durationText: `${Math.round(durationMin)} min`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: error.message || 'Erreur serveur.' })
    };
  }
};
