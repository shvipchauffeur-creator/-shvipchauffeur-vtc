import { getJson } from './api.js';
import { state } from './state.js';
import { closeModal, setContent, showModal, showToast } from './ui.js';
import { escapeHtml, skeleton, valueOf } from './utils.js';

function driverCard(d) {
  const initials = `${(d.firstname || '?')[0]}${(d.lastname || '?')[0]}`;
  const status = d.status === 'active' ? 'Actif' : 'Inactif';
  const statusClass = d.status === 'active' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]';
  const vehicle = d.vehicle_type === 'berline' ? 'Berline Premium' : d.vehicle_type === 'van' ? 'Van/MPV' : 'Van Luxe';
  return `<div class="bg-black/20 rounded-xl p-4 border border-[rgba(255,255,255,0.08)] hover:border-[#D6B15E]/30 transition-all"><div class="flex justify-between items-start mb-4"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-full bg-[#D6B15E] flex items-center justify-center text-black font-bold text-lg">${escapeHtml(initials)}</div><div><div class="font-semibold text-white">${escapeHtml(`${d.firstname || ''} ${d.lastname || ''}`.trim() || 'Chauffeur')}</div><div class="text-xs font-mono text-[#D6B15E]">${escapeHtml(d.code || '')}</div></div></div><span class="text-xs px-2 py-1 rounded-full ${statusClass}">${status}</span></div><div class="text-sm text-[#A8B0C2] space-y-1 mb-3"><div><i class="fas fa-envelope mr-2"></i>${escapeHtml(d.email || '-')}</div><div><i class="fas fa-phone mr-2"></i>${escapeHtml(d.phone || '-')}</div><div><i class="fas fa-car mr-2"></i>${escapeHtml(vehicle)}</div></div><div class="flex gap-2"><button onclick="app.editDriver('${d.id}')" class="flex-1 py-2 rounded-lg bg-[#D6B15E]/20 text-[#D6B15E] text-sm"><i class="fas fa-edit mr-1"></i>Modifier</button><button onclick="app.toggleDriverStatus('${d.id}')" class="py-2 px-3 rounded-lg bg-white/5 text-white text-sm"><i class="fas fa-power-off"></i></button><button onclick="app.deleteDriver('${d.id}')" class="py-2 px-3 rounded-lg bg-[#EF4444]/20 text-[#EF4444] text-sm"><i class="fas fa-trash"></i></button></div></div>`;
}

function renderDrivers(drivers) {
  setContent(`
    <div class="glass-panel rounded-2xl p-6 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div class="relative"><i class="fas fa-search absolute left-3 top-3 text-[#A8B0C2]"></i><input type="text" placeholder="Rechercher un chauffeur..." class="pl-10 pr-4 py-2 rounded-xl bg-black/30 border border-[rgba(255,255,255,0.12)] focus:border-[#D6B15E] focus:outline-none w-64 text-white" onkeyup="app.filterDrivers(this.value)"></div>
        <button onclick="app.showModal('driver')" class="px-4 py-2 rounded-xl gold-gradient text-black font-medium"><i class="fas fa-plus mr-2"></i>Nouveau chauffeur</button>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4" id="driversGrid">${drivers.length ? drivers.map(driverCard).join('') : `<div class="col-span-3 text-center py-12 text-[#A8B0C2]"><i class="fas fa-id-card text-4xl mb-4 opacity-30"></i><p>Aucun chauffeur enregistré</p><button onclick="app.showModal('driver')" class="mt-4 px-4 py-2 rounded-xl gold-gradient text-black font-medium text-sm"><i class="fas fa-plus mr-1"></i>Ajouter le premier chauffeur</button></div>`}</div>
    </div>`);
}

export async function loadDrivers() {
  setContent(skeleton());
  const data = await getJson('/admin-drivers').catch(() => ({ drivers: state.drivers || [] }));
  state.drivers = data.drivers || [];
  renderDrivers(state.drivers);
}

export function filterDrivers(query = '') {
  const q = query.toLowerCase();
  const filtered = state.drivers.filter((d) => `${d.firstname || ''} ${d.lastname || ''} ${d.code || ''} ${d.email || ''}`.toLowerCase().includes(q));
  const grid = document.getElementById('driversGrid');
  if (!grid) return;
  grid.innerHTML = filtered.length ? filtered.map(driverCard).join('') : `<div class="col-span-3 text-center py-12 text-[#A8B0C2]"><i class="fas fa-search text-4xl mb-4 opacity-30"></i><p>Aucun résultat pour "${escapeHtml(query)}"</p></div>`;
}

export function editDriver(id) {
  const d = state.drivers.find((driver) => driver.id === id);
  if (!d) return;
  state.currentDriver = d;
  const map = {
    driverId: d.id,
    driverFirstname: d.firstname,
    driverLastname: d.lastname,
    driverEmail: d.email,
    driverPhone: d.phone,
    driverCode: d.code,
    driverVehicleType: d.vehicle_type,
    driverPlate: d.plate,
    driverNotes: d.notes
  };
  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  });
  showModal('driver');
}

export function toggleDriverStatus(id) {
  const d = state.drivers.find((driver) => driver.id === id);
  if (!d) return;
  d.status = d.status === 'active' ? 'inactive' : 'active';
  showToast('Statut modifié', 'success');
  renderDrivers(state.drivers);
}

export function deleteDriver(id) {
  state.drivers = state.drivers.filter((driver) => driver.id !== id);
  showToast('Chauffeur supprimé', 'success');
  renderDrivers(state.drivers);
}

export function saveDriver() {
  const payload = {
    id: document.getElementById('driverId')?.value || crypto.randomUUID(),
    firstname: valueOf('driverFirstname'),
    lastname: valueOf('driverLastname'),
    email: valueOf('driverEmail'),
    phone: valueOf('driverPhone'),
    code: valueOf('driverCode'),
    vehicle_type: valueOf('driverVehicleType') || 'berline',
    plate: valueOf('driverPlate'),
    notes: valueOf('driverNotes'),
    status: 'active'
  };
  if (!payload.firstname || !payload.lastname) {
    showToast('Prénom et nom requis.', 'error');
    return;
  }
  const index = state.drivers.findIndex((driver) => driver.id === payload.id);
  if (index >= 0) state.drivers[index] = { ...state.drivers[index], ...payload };
  else state.drivers.unshift(payload);
  closeModal('driver');
  showToast('Chauffeur enregistré', 'success');
  renderDrivers(state.drivers);
}
