import { apiCall, getJson } from './api.js';
import { state } from './state.js';
import { closeModal, setContent, showModal, showToast } from './ui.js';
import { escapeHtml, formatDateTime, formatMoney, skeleton, valueOf } from './utils.js';

function badgeStatus(status) {
  const s = String(status || 'pending').toLowerCase();
  const map = {
    pending: 'bg-[#F59E0B]/20 text-[#F59E0B]',
    confirmed: 'bg-[#10B981]/20 text-[#10B981]',
    completed: 'bg-[#3B82F6]/20 text-[#3B82F6]',
    cancelled: 'bg-[#EF4444]/20 text-[#EF4444]'
  };
  return `<span class="px-2 py-1 rounded-full text-xs ${map[s] || map.pending}">${escapeHtml(s)}</span>`;
}

function renderReservations(rows) {
  const total = rows.length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const confirmed = rows.filter((r) => r.status === 'confirmed').length;
  const totalCa = rows.reduce((sum, r) => sum + Number(r.price_eur || 0), 0);

  setContent(`
    <div class="space-y-6 animate-fade-in">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-white">${total}</div><div class="text-xs text-[#A8B0C2] mt-1">Total réservations</div></div>
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-[#F59E0B]">${pending}</div><div class="text-xs text-[#A8B0C2] mt-1">En attente</div></div>
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-[#10B981]">${confirmed}</div><div class="text-xs text-[#A8B0C2] mt-1">Confirmées</div></div>
        <div class="glass-panel rounded-2xl p-4 text-center"><div class="text-3xl font-bold text-[#D6B15E]">${formatMoney(totalCa)}</div><div class="text-xs text-[#A8B0C2] mt-1">CA total</div></div>
      </div>

      <div class="glass-panel p-6 rounded-2xl">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div><h2 class="text-xl font-bold text-white">Réservations</h2><p class="text-sm text-[#A8B0C2]">Demandes & réservations confirmées</p></div>
          <div class="flex gap-3">
            <button onclick="app.showModal('reservation')" class="px-4 py-2 rounded-xl gold-gradient text-black font-medium"><i class="fas fa-plus mr-2"></i>Nouvelle réservation</button>
            <button onclick="app.refreshReservations()" class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"><i class="fas fa-sync mr-2"></i>Actualiser</button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left border-b border-[rgba(255,255,255,0.12)]">
                <th class="pb-3 text-xs text-[#A8B0C2] uppercase">Date</th>
                <th class="pb-3 text-xs text-[#A8B0C2] uppercase">Client</th>
                <th class="pb-3 text-xs text-[#A8B0C2] uppercase">Trajet</th>
                <th class="pb-3 text-xs text-[#A8B0C2] uppercase text-right">Prix</th>
                <th class="pb-3 text-xs text-[#A8B0C2] uppercase">Statut</th>
                <th class="pb-3 text-xs text-[#A8B0C2] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              ${rows.map((r) => `
                <tr class="border-b border-[rgba(255,255,255,0.06)] hover:bg-white/5 transition-colors">
                  <td class="py-3 text-white">${formatDateTime(r.datetime)}</td>
                  <td class="py-3"><div class="text-white">${escapeHtml(r.client_name || '—')}</div><div class="text-xs text-[#A8B0C2]">${escapeHtml(r.client_email || '')}</div></td>
                  <td class="py-3 text-white">${escapeHtml(r.pickup || '—')} <span class="text-[#A8B0C2]">→</span> ${escapeHtml(r.dropoff || '—')}</td>
                  <td class="py-3 text-right font-bold text-[#D6B15E]">${formatMoney(r.price_eur || 0)}</td>
                  <td class="py-3">${badgeStatus(r.status)}</td>
                  <td class="py-3"><div class="flex gap-2 flex-wrap"><button onclick="app.setReservationStatus('${r.id}','confirmed')" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs">Confirmer</button><button onclick="app.setReservationStatus('${r.id}','completed')" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs">Terminer</button><button onclick="app.openQuoteFromReservation('${r.id}')" class="px-3 py-1.5 rounded-xl gold-gradient text-black text-xs font-semibold">Devis</button></div></td>
                </tr>`).join('') || '<tr><td colspan="6" class="py-8 text-center text-[#A8B0C2]">Aucune réservation trouvée</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`);
}

export async function loadReservations() {
  setContent(skeleton());
  const data = await getJson('/admin-reservations-list').catch(() => ({ rows: [] }));
  state.reservations = Array.isArray(data.rows) ? data.rows : [];
  renderReservations(state.reservations);
}

export async function refreshReservations() {
  await loadReservations();
}

export async function setReservationStatus(id, status) {
  try {
    const response = await apiCall('/admin-reservations-update', { method: 'POST', body: JSON.stringify({ id, status }) });
    if (!response.ok) throw new Error();
    showToast('Statut mis à jour', 'success');
  } catch {
    const target = state.reservations.find((r) => r.id === id);
    if (target) target.status = status;
    showToast('Mise à jour locale effectuée', 'info');
  }
  renderReservations(state.reservations);
}

export function openQuoteFromReservation(id) {
  const r = (state.reservations || []).find((x) => x.id === id);
  if (!r) return;
  showModal('newQuote');
  const desc = `Réservation SHVIP: ${r.pickup} → ${r.dropoff} (${new Date(r.datetime).toLocaleString('fr-FR')})`;
  const candidates = {
    quoteCustomerEmail: r.client_email || '',
    customerEmail: r.client_email || '',
    qCustomerEmail: r.client_email || '',
    quoteCustomerName: r.client_name || '',
    customerName: r.client_name || '',
    qCustomerName: r.client_name || '',
    quoteDescription: desc,
    description: desc,
    qDescription: desc,
    quoteTotalAmount: r.price_eur || '',
    totalAmount: r.price_eur || '',
    qTotalAmount: r.price_eur || ''
  };
  Object.entries(candidates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
}

export async function createReservationFromModal() {
  const payload = {
    client_name: valueOf('resClientName'),
    client_email: valueOf('resClientEmail'),
    client_phone: valueOf('resClientPhone'),
    pickup: valueOf('resPickup'),
    dropoff: valueOf('resDropoff'),
    datetime: document.getElementById('resDatetime')?.value || '',
    vehicle: valueOf('resVehicle') || 'berline',
    price_eur: Number(valueOf('resPrice') || 0),
    notes: valueOf('resNotes')
  };

  if (!payload.client_name || !payload.client_email || !payload.pickup || !payload.dropoff || !payload.datetime || !payload.price_eur) {
    showToast('Champs requis manquants.', 'error');
    return;
  }

  const response = await apiCall('/admin-reservations-create', { method: 'POST', body: JSON.stringify(payload) }).catch(() => null);
  const data = response ? await response.json().catch(() => ({})) : {};
  if (!response || !response.ok || data.ok === false) {
    showToast(data.error || 'Réservation enregistrée localement uniquement.', 'info');
    state.reservations.unshift({ id: crypto.randomUUID(), status: 'pending', ...payload });
  } else {
    showToast('Réservation créée ✅', 'success');
  }
  closeModal('reservation');
  await loadReservations();
}
