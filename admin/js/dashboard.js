import { getJson } from './api.js';
import { setContent } from './ui.js';
import { formatDateTime, formatMoney, skeleton } from './utils.js';

export async function loadDashboard() {
  setContent(skeleton());
  const [payments, quotes, stats] = await Promise.all([
    getJson('/admin-list-payments?limit=5').catch(() => ({ payments: [] })),
    getJson('/admin-list-quotes?limit=5').catch(() => ({ quotes: [] })),
    getJson('/admin-stats').catch(() => ({}))
  ]);

  const totalRevenueCents = (payments.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingQuotes = (quotes.quotes || []).filter((q) => q.status === 'pending').length;
  const acceptedQuotes = (quotes.quotes || []).filter((q) => q.status === 'accepted').length;
  const conversionRate = (quotes.quotes || []).length ? Math.round((acceptedQuotes / quotes.quotes.length) * 100) : 0;

  setContent(`
    <div class="grid md:grid-cols-4 gap-6 mb-8 animate-fade-in">
      <div class="glass-panel rounded-2xl p-6"><p class="text-[#A8B0C2] text-sm">Chiffre d'affaires</p><h3 class="text-3xl font-bold text-[#D6B15E] mt-1">${formatMoney(totalRevenueCents, true)}</h3></div>
      <div class="glass-panel rounded-2xl p-6"><p class="text-[#A8B0C2] text-sm">Devis en attente</p><h3 class="text-3xl font-bold text-white mt-1">${pendingQuotes}</h3></div>
      <div class="glass-panel rounded-2xl p-6"><p class="text-[#A8B0C2] text-sm">Conversion devis</p><h3 class="text-3xl font-bold text-[#10B981] mt-1">${conversionRate}%</h3></div>
      <div class="glass-panel rounded-2xl p-6"><p class="text-[#A8B0C2] text-sm">Courses</p><h3 class="text-3xl font-bold text-white mt-1">${stats.totalCourses ?? '—'}</h3></div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="glass-panel rounded-2xl p-6">
        <div class="flex items-center justify-between mb-4"><h3 class="text-xl font-bold text-white">Derniers paiements</h3><button onclick="app.navigate('payments')" class="text-xs text-[#D6B15E] hover:underline">Voir tout →</button></div>
        <div class="space-y-3">
          ${(payments.payments || []).map((p) => `
            <div class="bg-black/20 rounded-xl p-4 border border-[rgba(255,255,255,0.06)] flex justify-between items-center gap-4">
              <div>
                <div class="text-sm text-white font-medium">${p.customerEmail || 'Client'}</div>
                <div class="text-xs text-[#A8B0C2]">${formatDateTime(p.created)}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-[#D6B15E]">${formatMoney(p.amount, true)}</div>
                <div class="text-xs ${p.status === 'succeeded' ? 'text-[#10B981]' : 'text-[#F59E0B]'}">${p.status || '—'}</div>
              </div>
            </div>`).join('') || '<div class="text-sm text-[#A8B0C2]">Aucun paiement récent</div>'}
        </div>
      </div>
      <div class="glass-panel rounded-2xl p-6">
        <h3 class="text-xl font-bold text-white mb-4">Derniers devis</h3>
        <div class="space-y-3">
          ${(quotes.quotes || []).map((q) => `
            <div class="bg-black/20 rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
              <div class="flex justify-between items-center gap-4">
                <div>
                  <div class="text-sm text-white font-medium">${q.customerName || q.customerEmail || 'Client'}</div>
                  <div class="text-xs text-[#A8B0C2]">${q.description || 'Devis SHVIP'}</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-[#D6B15E]">${formatMoney(q.amount || q.totalAmount || 0)}</div>
                  <div class="text-xs ${q.status === 'accepted' ? 'text-[#10B981]' : 'text-[#F59E0B]'}">${q.status || 'pending'}</div>
                </div>
              </div>
            </div>`).join('') || '<div class="text-sm text-[#A8B0C2]">Aucun devis récent</div>'}
        </div>
      </div>
    </div>`);
}
