// netlify/functions/admin-stats.js
// Retourne les vraies statistiques depuis Supabase + Stripe

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  // Vérification du token admin
  const auth =
  event.headers?.authorization ||
  event.headers?.Authorization ||
  event.headers?.["x-admin-token"] ||
  event.headers?.["X-Admin-Token"] ||
  "";

const token = auth.replace("Bearer ", "").trim();

if (!token || token !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    // === SUPABASE : réservations ===
    const { data: allReservations } = await supabase
      .from('reservations')
      .select('id, status, price_eur, created_at, vehicle, pickup, dropoff, datetime, client_name, client_email, payment_status')
      .order('created_at', { ascending: false });

    const reservations = allReservations || [];

    // Stats réservations ce mois
    const resThisMonth = reservations.filter(r => r.created_at >= startOfMonth);
    const resLastMonth = reservations.filter(r => r.created_at >= startOfLastMonth && r.created_at <= endOfLastMonth);

    const completed = reservations.filter(r => r.status === 'completed');
    const completedThisMonth = resThisMonth.filter(r => r.status === 'completed');
    const completedLastMonth = resLastMonth.filter(r => r.status === 'completed');

    const caTotal = reservations.filter(r => r.payment_status === 'paid').reduce((s, r) => s + Number(r.price_eur || 0), 0);
    const caThisMonth = resThisMonth.filter(r => r.payment_status === 'paid').reduce((s, r) => s + Number(r.price_eur || 0), 0);
    const caLastMonth = resLastMonth.filter(r => r.payment_status === 'paid').reduce((s, r) => s + Number(r.price_eur || 0), 0);

    const caEvolution = caLastMonth > 0 ? Math.round(((caThisMonth - caLastMonth) / caLastMonth) * 100) : 0;
    const ridesEvolution = completedLastMonth.length > 0
      ? Math.round(((completedThisMonth.length - completedLastMonth.length) / completedLastMonth.length) * 100)
      : 0;

    // Taux de conversion (devis → réservation confirmée ou payée)
    const { data: allQuotes } = await supabase.from('quotes').select('id, status').catch(() => ({ data: [] }));
    const quotes = allQuotes || [];
    const acceptedQuotes = quotes.filter(q => ['accepted', 'paid', 'confirmed'].includes(q.status)).length;
    const conversionRate = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

    // Répartition par type de trajet
    const pickupLower = (r) => (r.pickup || '').toLowerCase();
    const repartition = {
      cdg: reservations.filter(r => pickupLower(r).includes('cdg') || pickupLower(r).includes('charles de gaulle') || pickupLower(r).includes('roissy')).length,
      orly: reservations.filter(r => pickupLower(r).includes('orly')).length,
      gares: reservations.filter(r => ['gare du nord','gare de lyon','gare montparnasse','gare saint lazare','gare de l\'est'].some(g => pickupLower(r).includes(g))).length,
    };
    repartition.autres = reservations.length - repartition.cdg - repartition.orly - repartition.gares;

    // Evolution CA par mois (12 derniers mois)
    const caParMois = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const debut = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const ca = reservations
        .filter(r => r.payment_status === 'paid' && r.created_at >= debut && r.created_at <= fin)
        .reduce((s, r) => s + Number(r.price_eur || 0), 0);
      caParMois.push({ mois: d.toLocaleDateString('fr-FR', { month: 'short' }), ca: Math.round(ca) });
    }

    // Courses aujourd'hui
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    const coursesAujourdhui = reservations.filter(r => {
      const dt = r.datetime || r.created_at;
      return dt >= todayISO && dt < tomorrowISO;
    });

    const caAujourdhui = coursesAujourdhui.filter(r => r.payment_status === 'paid').reduce((s, r) => s + Number(r.price_eur || 0), 0);
    const enCours = coursesAujourdhui.filter(r => r.status === 'confirmed').length;
    const enAttente = coursesAujourdhui.filter(r => r.status === 'pending').length;

    // === STRIPE : note moyenne (approximée via charges réussies) ===
    // (Stripe ne stocke pas les notes — on retourne une note moyenne depuis Supabase si la colonne existe)
    const { data: driversData } = await supabase.from('drivers').select('rating').catch(() => ({ data: [] }));
    const drivers = driversData || [];
    const noteMoyenne = drivers.length > 0
      ? (drivers.reduce((s, d) => s + Number(d.rating || 0), 0) / drivers.filter(d => d.rating).length).toFixed(1)
      : null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        // KPIs principaux
        caTotal: Math.round(caTotal),
        caThisMonth: Math.round(caThisMonth),
        caEvolution,
        totalCourses: completed.length,
        coursesThisMonth: completedThisMonth.length,
        ridesEvolution,
        conversionRate,
        noteMoyenne,
        totalReservations: reservations.length,
        // Aujourd'hui
        coursesAujourdhui: coursesAujourdhui.length,
        caAujourdhui: Math.round(caAujourdhui),
        enCours,
        enAttente,
        // Evolution
        caParMois,
        // Repartition
        repartition,
        totalRepartition: reservations.length
      })
    };
  } catch (err) {
    console.error('admin-stats error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
