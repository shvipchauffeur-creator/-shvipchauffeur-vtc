import { getJson } from './api.js';
import { state } from './state.js';
import { setContent } from './ui.js';
import { escapeHtml, formatDateTime, formatMoney, skeleton } from './utils.js';

export async function loadCalendar() {
  setContent(skeleton());
  const currentWeek = getWeekDates(state.currentWeekOffset);
  const data = await getJson('/admin-reservations-list').catch(() => ({ rows: [] }));
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const grid = Array.from({ length: 7 }, (_, idx) => {
    const dayRows = rows.filter((r) => {
      const dt = new Date(r.datetime);
      return !Number.isNaN(dt.getTime()) && dt.toDateString() === currentWeek[idx].toDateString();
    });
    return `<div class="glass-panel rounded-2xl p-4 min-h-[240px]"><div class="font-semibold text-white mb-1">${currentWeek[idx].toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })}</div><div class="space-y-3 mt-4">${dayRows.map((r) => `<div class="bg-black/20 rounded-xl p-3 border border-[rgba(255,255,255,0.06)]"><div class="text-white text-sm font-medium">${escapeHtml(r.client_name || 'Client')}</div><div class="text-xs text-[#A8B0C2]">${formatDateTime(r.datetime)}</div><div class="text-xs text-[#A8B0C2] mt-1">${escapeHtml(r.pickup || '')} → ${escapeHtml(r.dropoff || '')}</div></div>`).join('') || '<div class="text-xs text-[#A8B0C2]">Aucune course</div>'}</div></div>`;
  }).join('');
  setContent(`
    <div class="glass-panel rounded-2xl p-6 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"><div><h3 class="font-bold text-xl text-white">Planning hebdomadaire</h3><p class="text-sm text-[#A8B0C2]">Semaine du ${currentWeek[0].toLocaleDateString('fr-FR')} au ${currentWeek[6].toLocaleDateString('fr-FR')}</p></div><div class="flex items-center gap-3"><button onclick="app.changeWeek(-1)" class="p-2 rounded-lg hover:bg-white/10 transition-all border border-[rgba(255,255,255,0.12)] text-white"><i class="fas fa-chevron-left"></i></button><button onclick="app.changeWeek(0)" class="px-4 py-2 rounded-lg bg-[#D6B15E]/20 text-[#D6B15E] text-sm font-medium hover:bg-[#D6B15E]/30 transition-all">Aujourd'hui</button><button onclick="app.changeWeek(1)" class="p-2 rounded-lg hover:bg-white/10 transition-all border border-[rgba(255,255,255,0.12)] text-white"><i class="fas fa-chevron-right"></i></button></div></div>
      <div class="grid lg:grid-cols-7 gap-4">${grid}</div>
    </div>`);
}

export function getWeekDates(offset = 0) {
  const today = new Date();
  const start = new Date(today);
  const day = today.getDay() || 7;
  start.setDate(today.getDate() - day + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

export async function changeWeek(delta) {
  state.currentWeekOffset = delta === 0 ? 0 : state.currentWeekOffset + delta;
  await loadCalendar();
}

export async function loadRides() {
  setContent(skeleton());
  const data = await getJson('/admin-reservations-list').catch(() => ({ rows: [] }));
  const rides = (data.rows || []).slice(0, 10).map((r, i) => ({
    id: r.id || `RIDE-${String(i + 1).padStart(3, '0')}`,
    client: r.client_name || 'Client',
    driver: r.driver_name || 'Non assigné',
    from: r.pickup || '',
    to: r.dropoff || '',
    status: String(r.status || '').toLowerCase() === 'completed' ? 'completed' : String(r.status || '').toLowerCase() === 'confirmed' ? 'in_progress' : 'pending',
    progress: String(r.status || '').toLowerCase() === 'completed' ? 100 : String(r.status || '').toLowerCase() === 'confirmed' ? 65 : 10,
    eta: String(r.status || '').toLowerCase() === 'completed' ? 'Terminé' : String(r.status || '').toLowerCase() === 'confirmed' ? 'En cours' : 'En attente',
    price: Number(r.price_eur || 0)
  }));
  setContent(`
    <div class="space-y-6 animate-fade-in">
      <div class="grid md:grid-cols-4 gap-4">
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-[#10B981]">${rides.filter(r => r.status === 'in_progress').length}</div><div class="text-xs text-[#A8B0C2]">En cours</div></div>
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-[#F59E0B]">${rides.filter(r => r.status === 'pending').length}</div><div class="text-xs text-[#A8B0C2]">En attente</div></div>
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-[#D6B15E]">${rides.length}</div><div class="text-xs text-[#A8B0C2]">Courses chargées</div></div>
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-white">${formatMoney(rides.reduce((sum, r) => sum + r.price, 0))}</div><div class="text-xs text-[#A8B0C2]">Valeur affichée</div></div>
      </div>
      <div class="glass-panel rounded-2xl p-6"><div class="flex justify-between items-center mb-6"><h3 class="font-bold text-xl text-white">Courses en temps réel</h3><div class="flex items-center gap-2 text-xs text-[#10B981]"><span class="live-dot"></span><span>Mise à jour active</span></div></div><div class="space-y-4">${rides.map((ride) => `<div class="bg-black/20 rounded-xl p-4 border border-[rgba(255,255,255,0.08)]"><div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div class="font-semibold text-white">${escapeHtml(ride.client)}</div><div class="text-sm text-[#A8B0C2] mt-1">${escapeHtml(ride.from)} → ${escapeHtml(ride.to)}</div><div class="text-xs text-[#A8B0C2] mt-1">Chauffeur : ${escapeHtml(ride.driver)}</div></div><div class="lg:w-64"><div class="flex justify-between text-xs mb-2"><span class="text-[#A8B0C2]">${escapeHtml(ride.eta)}</span><span class="text-white">${ride.progress}%</span></div><div class="h-2 rounded-full bg-white/5 overflow-hidden"><div class="h-full rounded-full ${ride.status === 'completed' ? 'bg-[#10B981]' : ride.status === 'in_progress' ? 'bg-[#D6B15E]' : 'bg-[#F59E0B]'}" style="width:${ride.progress}%"></div></div></div></div></div>`).join('') || '<div class="text-sm text-[#A8B0C2]">Aucune course chargée</div>'}</div></div>
    </div>`);
}

export async function loadClients() {
  setContent(`<div class="glass-panel rounded-2xl p-6 animate-fade-in"><div class="text-center py-12 text-[#A8B0C2]"><i class="fas fa-users text-4xl mb-4 opacity-50"></i><p>Module clients - En développement</p><p class="text-sm mt-2">Cette section sera synchronisée avec vos devis, paiements et réservations</p></div></div>`);
}

export async function loadSettings() {
  setContent(`
    <div class="glass-panel rounded-2xl p-6 animate-fade-in">
      <h3 class="font-bold text-xl text-white mb-6">Configuration</h3>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-black/20 rounded-xl p-5 border border-[rgba(255,255,255,0.08)]"><div class="text-white font-semibold mb-2">Environnement</div><div class="text-sm text-[#A8B0C2]">Les badges en haut reflètent l'URL actuelle. Aucune clé secrète n'est exposée ici.</div></div>
        <div class="bg-black/20 rounded-xl p-5 border border-[rgba(255,255,255,0.08)]"><div class="text-white font-semibold mb-2">Sécurité admin</div><div class="text-sm text-[#A8B0C2]">La session reste stockée en sessionStorage. Pour aller plus loin, passe ensuite sur un vrai login backend signé.</div></div>
        <div class="bg-black/20 rounded-xl p-5 border border-[rgba(255,255,255,0.08)]"><div class="text-white font-semibold mb-2">Exports</div><div class="text-sm text-[#A8B0C2]">Les exports déclenchent un JSON local. On pourra brancher ensuite les vrais exports serveur.</div></div>
        <div class="bg-black/20 rounded-xl p-5 border border-[rgba(255,255,255,0.08)]"><div class="text-white font-semibold mb-2">Modals</div><div class="text-sm text-[#A8B0C2]">Les modals existants de ton HTML original sont conservés et pilotés par les nouveaux modules.</div></div>
      </div>
    </div>`);
}
