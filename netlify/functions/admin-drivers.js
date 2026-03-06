// netlify/functions/admin-drivers.js
// CRUD complet des chauffeurs dans Supabase
// GET    /admin-drivers             → liste tous les chauffeurs
// POST   /admin-drivers             → crée un chauffeur
// PUT    /admin-drivers?id=xxx      → modifie un chauffeur
// DELETE /admin-drivers?id=xxx      → supprime un chauffeur

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  // Auth
  const token = (event.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorisé' }) };
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  try {
    // ── GET : liste des chauffeurs ──────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec les stats de courses depuis reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('driver_id, price_eur, status');

      const enriched = (data || []).map(driver => {
        const driverRides = (reservations || []).filter(r => r.driver_id === driver.id);
        const completedRides = driverRides.filter(r => r.status === 'completed');
        const revenue = completedRides.reduce((s, r) => s + Number(r.price_eur || 0), 0);
        return {
          ...driver,
          rides: completedRides.length,
          revenue: Math.round(revenue)
        };
      });

      return { statusCode: 200, headers, body: JSON.stringify({ drivers: enriched }) };
    }

    // ── POST : créer un chauffeur ────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { firstname, lastname, email, phone, code, vehicle, commission } = body;

      if (!firstname || !lastname || !email || !code) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Champs obligatoires manquants (prénom, nom, email, code)' }) };
      }

      // Vérifier que le code est unique
      const { data: existing } = await supabase.from('drivers').select('id').eq('code', code.toUpperCase()).single();
      if (existing) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: `Le code ${code} est déjà utilisé` }) };
      }

      const { data, error } = await supabase
        .from('drivers')
        .insert({
          firstname: firstname.trim(),
          lastname: lastname.trim(),
          email: email.trim().toLowerCase(),
          phone: (phone || '').trim(),
          code: code.trim().toUpperCase(),
          vehicle: vehicle || 'berline',
          commission: Number(commission || 20),
          status: 'active',
          rating: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { statusCode: 201, headers, body: JSON.stringify({ driver: data }) };
    }

    // ── PUT : modifier un chauffeur ──────────────────────────────────────────
    if (event.httpMethod === 'PUT') {
      const id = event.queryStringParameters?.id;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID manquant' }) };

      const body = JSON.parse(event.body || '{}');
      const updates = {};
      if (body.firstname !== undefined) updates.firstname = body.firstname.trim();
      if (body.lastname !== undefined)  updates.lastname  = body.lastname.trim();
      if (body.email !== undefined)     updates.email     = body.email.trim().toLowerCase();
      if (body.phone !== undefined)     updates.phone     = body.phone.trim();
      if (body.code !== undefined)      updates.code      = body.code.trim().toUpperCase();
      if (body.vehicle !== undefined)   updates.vehicle   = body.vehicle;
      if (body.commission !== undefined) updates.commission = Number(body.commission);
      if (body.status !== undefined)    updates.status    = body.status;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase.from('drivers').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ driver: data }) };
    }

    // ── DELETE : supprimer un chauffeur ──────────────────────────────────────
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID manquant' }) };

      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Méthode non supportée' }) };

  } catch (err) {
    console.error('admin-drivers error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
