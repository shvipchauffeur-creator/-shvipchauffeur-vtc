import { getJson } from './api.js';
import { setContent } from './ui.js';
import { formatMoney, skeleton } from './utils.js';

export async function loadStats() {
  setContent(skeleton());
  const s = await getJson('/admin-stats').catch(() => ({}));
  const evoBadge = (pct = 0) => pct >= 0
    ? `<span class="text-[#10B981]"><i class="fas fa-arrow-up"></i> +${pct}%</span>`
    : `<span class="text-[#EF4444]"><i class="fas fa-arrow-down"></i> ${pct}%</span>`;
  const repartition = [
    ['Berline', s.berlineCount || 0],
    ['Van', s.vanCount || 0],
    ['Aéroport', s.airportCount || 0],
    ['Business', s.businessCount || 0]
  ];
  const total = repartition.reduce((sum, [, value]) => sum + value, 0) || 1;

  setContent(`
    <div class="space-y-6 animate-fade-in">
      <div class="grid md:grid-cols-4 gap-4">
        <div class="glass-panel rounded-2xl p-4"><div class="text-3xl font-bold text-[#D6B15E]">${formatMoney(s.caTotal || 0)}</div><div class="text-sm text-[#A8B0C2]">Chiffre d'affaires total</div><div class="text-xs mt-1">${evoBadge(s.caEvolution)} <span class="text-[#A8B0C2]">vs mois dernier</span></div></div>
        <div class="glass-panel rounded-2xl p-4"><div class="text-3xl font-bold text-white">${s.totalCourses ?? '—'}</div><div class="text-sm text-[#A8B0C2]">Courses réalisées</div><div class="text-xs mt-1">${evoBadge(s.ridesEvolution)} <span class="text-[#A8B0C2]">vs mois dernier</span></div></div>
        <div class="glass-panel rounded-2xl p-4"><div class="text-3xl font-bold text-[#10B981]">${s.noteMoyenne ?? '—'}</div><div class="text-sm text-[#A8B0C2]">Note moyenne</div></div>
        <div class="glass-panel rounded-2xl p-4"><div class="text-3xl font-bold text-white">${s.totalClients ?? '—'}</div><div class="text-sm text-[#A8B0C2]">Clients actifs</div></div>
      </div>
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="glass-panel rounded-2xl p-6"><h3 class="text-xl font-bold text-white mb-5">Répartition activité</h3><div class="space-y-4">${repartition.map(([label, value]) => `<div><div class="flex justify-between text-sm mb-1"><span class="text-white">${label}</span><span class="text-[#A8B0C2]">${Math.round((value / total) * 100)}%</span></div><div class="h-2 rounded-full bg-white/5 overflow-hidden"><div class="h-full rounded-full gold-gradient" style="width:${Math.round((value / total) * 100)}%"></div></div></div>`).join('')}</div></div>
        <div class="glass-panel rounded-2xl p-6"><h3 class="text-xl font-bold text-white mb-5">Synthèse</h3><div class="space-y-3 text-sm text-[#A8B0C2]"><div class="flex justify-between"><span>Panier moyen</span><span class="text-white font-semibold">${formatMoney(s.panierMoyen || 0)}</span></div><div class="flex justify-between"><span>Taux conversion</span><span class="text-white font-semibold">${s.conversionRate ?? 0}%</span></div><div class="flex justify-between"><span>Délai moyen réponse</span><span class="text-white font-semibold">${s.responseTime ?? '—'}</span></div><div class="flex justify-between"><span>Taux satisfaction</span><span class="text-white font-semibold">${s.satisfactionRate ?? '—'}</span></div></div></div>
      </div>
    </div>`);
}
