import { apiCall, getJson } from './api.js';
import { state } from './state.js';
import { closeModal, setContent, showModal, showToast, updatePriceFields } from './ui.js';
import { escapeHtml, formatDate, formatDateTime, formatMoney, skeleton, valueOf } from './utils.js';

export async function loadPayments() {
  setContent(skeleton());
  const data = await getJson('/admin-list-payments?limit=50').catch(() => ({ payments: [] }));
  state.payments = data.payments || [];
  setContent(`
    <div class="glass-panel rounded-2xl p-6 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 class="font-bold text-xl text-white">Paiements Stripe</h3>
        <div class="flex gap-3">
          <button onclick="app.showModal('export')" class="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-white/10 text-sm text-white"><i class="fas fa-download mr-2"></i>Exporter</button>
          <button onclick="app.refreshData()" class="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-white/10 text-sm text-white"><i class="fas fa-sync mr-2"></i>Actualiser</button>
        </div>
      </div>
      <div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left border-b border-[rgba(255,255,255,0.12)]"><th class="pb-3 text-xs text-[#A8B0C2] uppercase">Date</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase">Client</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase">ID Stripe</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase text-right">Montant</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase">Statut</th></tr></thead><tbody class="text-sm">${(state.payments).map((p) => `<tr class="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/5 transition-colors"><td class="py-3 text-white">${formatDateTime(p.created)}</td><td class="py-3 text-white">${escapeHtml(p.customerEmail || '-')}</td><td class="py-3 font-mono text-[#A8B0C2] text-xs">${escapeHtml(p.id || '-')}</td><td class="py-3 text-right font-bold text-[#D6B15E]">${formatMoney(p.amount, true)}</td><td class="py-3"><span class="px-2 py-1 rounded-full text-xs ${p.status === 'succeeded' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}">${escapeHtml(p.status || '—')}</span></td></tr>`).join('') || '<tr><td colspan="5" class="py-8 text-center text-[#A8B0C2]">Aucun paiement trouvé</td></tr>'}</tbody></table></div>
    </div>`);
}

export async function loadQuotes() {
  setContent(skeleton());
  const data = await getJson('/admin-list-quotes?limit=50').catch(() => ({ quotes: [] }));
  state.quotes = data.quotes || [];
  setContent(`
    <div class="glass-panel rounded-2xl p-6 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 class="font-bold text-xl text-white">Devis clients</h3>
        <button onclick="app.showModal('newQuote')" class="px-4 py-2 rounded-xl gold-gradient text-black font-medium"><i class="fas fa-plus mr-2"></i>Nouveau devis</button>
      </div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">${(state.quotes).map((q, idx) => `<div class="bg-black/20 rounded-xl p-4 border border-[rgba(255,255,255,0.08)] hover:border-[#D6B15E]/30 transition-all"><div class="flex justify-between items-start gap-3 mb-3"><div><div class="font-semibold text-white">${escapeHtml(q.customerName || q.customerEmail || 'Client')}</div><div class="text-xs text-[#A8B0C2] mt-1">${escapeHtml(q.description || 'Devis SHVIP')}</div></div><span class="px-2 py-1 rounded-full text-xs ${q.status === 'accepted' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}">${escapeHtml(q.status || 'pending')}</span></div><div class="text-sm text-[#A8B0C2] mb-4">Créé le ${formatDate(q.createdAt || q.created)}</div><div class="flex justify-between items-center pt-3 border-t border-[rgba(255,255,255,0.08)]"><span class="font-bold text-lg text-[#D6B15E]">${formatMoney(q.amount || q.totalAmount || 0)}</span><button onclick="app.viewQuote(${idx})" class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm">Voir</button></div></div>`).join('') || '<div class="col-span-3 text-center text-[#A8B0C2] py-8">Aucun devis trouvé</div>'}</div>
    </div>`);
}

export async function loadInvoices() {
  setContent(skeleton());
  const data = await getJson('/admin-list-invoices?limit=50').catch(() => ({ invoices: [] }));
  state.invoices = data.invoices || [];
  setContent(`
    <div class="glass-panel rounded-2xl p-6 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"><h3 class="font-bold text-xl text-white">Factures</h3><button onclick="app.showModal('export')" class="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-white/10 text-sm text-white"><i class="fas fa-download mr-2"></i>Exporter</button></div>
      <div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left border-b border-[rgba(255,255,255,0.12)]"><th class="pb-3 text-xs text-[#A8B0C2] uppercase">N° Facture</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase">Client</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase">Date</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase text-right">Montant</th><th class="pb-3 text-xs text-[#A8B0C2] uppercase">Statut</th></tr></thead><tbody class="text-sm">${(state.invoices).map((inv) => `<tr class="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/5 transition-colors"><td class="py-3 font-mono text-[#D6B15E]">${escapeHtml(inv.id || '-')}</td><td class="py-3 text-white">${escapeHtml(inv.customerEmail || '-')}</td><td class="py-3 text-white">${formatDate(inv.created)}</td><td class="py-3 text-right font-bold text-white">${formatMoney(inv.amount || 0)}</td><td class="py-3"><span class="px-2 py-1 rounded-full text-xs ${inv.status === 'paid' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'}">${inv.status === 'paid' ? 'Payée' : 'En attente'}</span></td></tr>`).join('') || '<tr><td colspan="5" class="py-8 text-center text-[#A8B0C2]">Aucune facture trouvée</td></tr>'}</tbody></table></div>
    </div>`);
}

export async function submitQuote() {
  const payload = {
    customerName: valueOf('customerName') || valueOf('quoteCustomerName') || valueOf('qCustomerName'),
    customerEmail: valueOf('customerEmail') || valueOf('quoteCustomerEmail') || valueOf('qCustomerEmail'),
    description: valueOf('description') || valueOf('quoteDescription') || valueOf('qDescription'),
    amount: Number(valueOf('totalAmount') || valueOf('quoteTotalAmount') || valueOf('qTotalAmount') || 0),
    pricingMode: valueOf('pricingMode') || 'full',
    depositAmount: Number(valueOf('depositAmount') || 0),
    balanceAmount: Number(valueOf('balanceAmount') || 0)
  };
  if (!payload.customerEmail || !payload.amount) {
    showToast('Email client et montant requis.', 'error');
    return;
  }
  const response = await apiCall('/admin-create-quote', { method: 'POST', body: JSON.stringify(payload) }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  if (!response || !response.ok || data.ok === false) {
    state.quotes.unshift({ id: crypto.randomUUID(), status: 'pending', createdAt: new Date().toISOString(), ...payload });
    showToast(data.error || 'Devis ajouté localement.', 'info');
  } else {
    showToast('Devis envoyé ✅', 'success');
  }
  closeModal('newQuote');
  updatePriceFields();
  await loadQuotes();
}

export function viewQuote(index) {
  const quote = state.quotes[index];
  if (!quote) return;
  state.currentQuote = quote;
  const html = document.getElementById('quoteDetails');
  if (html) {
    html.innerHTML = `<div class="space-y-3 text-sm"><div><span class="text-[#A8B0C2]">Client :</span> <span class="text-white">${escapeHtml(quote.customerName || quote.customerEmail || 'Client')}</span></div><div><span class="text-[#A8B0C2]">Email :</span> <span class="text-white">${escapeHtml(quote.customerEmail || '—')}</span></div><div><span class="text-[#A8B0C2]">Description :</span> <span class="text-white">${escapeHtml(quote.description || '—')}</span></div><div><span class="text-[#A8B0C2]">Montant :</span> <span class="text-[#D6B15E] font-bold">${formatMoney(quote.amount || quote.totalAmount || 0)}</span></div><div><span class="text-[#A8B0C2]">Statut :</span> <span class="text-white">${escapeHtml(quote.status || 'pending')}</span></div></div>`;
  }
  showModal('viewQuote');
}
