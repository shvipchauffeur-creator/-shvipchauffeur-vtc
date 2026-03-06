
// ============================================================
// REMPLACE la fonction loadReservations + renderReservations
// dans ton admin-shvip.html (cherche "PAIEMENTS async loadReservations")
// ============================================================

  async loadReservations() {
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="space-y-6 animate-fade-in">

        <!-- STATS EN HAUT (amélioration C) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="resStatsRow">
          <div class="glass-panel rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-white" id="statTotal">—</div>
            <div class="text-xs text-A8B0C2 mt-1">Total réservations</div>
          </div>
          <div class="glass-panel rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-F59E0B" id="statPending">—</div>
            <div class="text-xs text-A8B0C2 mt-1">En attente</div>
          </div>
          <div class="glass-panel rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-10B981" id="statConfirmed">—</div>
            <div class="text-xs text-A8B0C2 mt-1">Confirmées</div>
          </div>
          <div class="glass-panel rounded-2xl p-4 text-center">
            <div class="text-3xl font-bold text-D6B15E" id="statCA">—</div>
            <div class="text-xs text-A8B0C2 mt-1">CA total</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- TABLE PRINCIPALE -->
          <div class="glass-panel p-6 rounded-2xl lg:col-span-2">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div>
                <h2 class="text-xl font-bold text-white">Réservations</h2>
                <p class="text-sm text-A8B0C2">Demandes & réservations confirmées — Supabase</p>
              </div>
              <div class="flex gap-3">
                <button onclick="app.refreshReservations()" class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm">
                  <i class="fas fa-rotate mr-2"></i>Actualiser
                </button>
                <button onclick="app.showModal('reservation')" class="px-4 py-2 rounded-xl gold-gradient text-black text-sm font-semibold">
                  <i class="fas fa-plus mr-2"></i>Nouvelle réservation
                </button>
              </div>
            </div>

            <!-- FILTRES -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input id="resQ" class="px-4 py-2 rounded-xl bg-white/5 text-white placeholder-A8B0C2 outline-none" placeholder="Filtrer nom/email/pickup/dropoff...">
              <select id="resStatus" class="px-4 py-2 rounded-xl bg-white/5 text-white outline-none">
                <option value="">Statut — Tous</option>
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
              <select id="resPay" class="px-4 py-2 rounded-xl bg-white/5 text-white outline-none">
                <option value="">Paiement — Tous</option>
                <option value="unpaid">unpaid</option>
                <option value="deposit">deposit</option>
                <option value="paid">paid</option>
              </select>
            </div>

            <!-- TABLEAU -->
            <div class="overflow-x-auto rounded-2xl border border-white/10">
              <table class="w-full text-sm">
                <thead class="bg-white/5 text-A8B0C2">
                  <tr>
                    <th class="text-left p-3">Date/Heure</th>
                    <th class="text-left p-3">Client</th>
                    <th class="text-left p-3">Trajet</th>
                    <th class="text-left p-3">Chauffeur</th>
                    <th class="text-left p-3">Véhicule</th>
                    <th class="text-left p-3">Prix</th>
                    <th class="text-left p-3">Paiement</th>
                    <th class="text-left p-3">Statut</th>
                    <th class="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody id="reservationsBody" class="text-white"></tbody>
              </table>
            </div>
            <div id="reservationsEmpty" class="hidden text-center text-A8B0C2 py-10">Aucune réservation.</div>
          </div>

          <!-- SIDEBAR DROITE -->
          <div class="space-y-4">
            <div class="glass-panel p-6 rounded-2xl">
              <h3 class="text-lg font-bold text-white mb-3">Raccourcis</h3>
              <div class="space-y-3">
                <button onclick="app.navigate('clients')" class="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm text-left">
                  <i class="fas fa-users mr-2"></i>Clients
                </button>
                <button onclick="app.navigate('drivers')" class="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm text-left">
                  <i class="fas fa-id-card mr-2"></i>Chauffeurs
                </button>
                <button onclick="app.navigate('rides')" class="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm text-left">
                  <i class="fas fa-car mr-2"></i>Courses
                </button>
              </div>
            </div>
            <div class="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div class="text-xs text-A8B0C2">Note</div>
              <div class="text-sm text-white mt-1">Le formulaire de réservation côté site envoie dans Supabase via une Netlify Function.</div>
            </div>
          </div>
        </div>
      </div>
    `;

    const apply = () => this.renderReservations();
    document.getElementById('resQ').addEventListener('input', apply);
    document.getElementById('resStatus').addEventListener('change', apply);
    document.getElementById('resPay').addEventListener('change', apply);
    await this.refreshReservations();
  },

  renderReservations() {
    const rows = state.reservations;
    const q   = (document.getElementById('resQ')?.value || '').toLowerCase().trim();
    const st  = (document.getElementById('resStatus')?.value || '').toLowerCase().trim();
    const pay = (document.getElementById('resPay')?.value || '').toLowerCase().trim();

    const filtered = rows.filter(r => {
      const blob = [r.clientname, r.clientemail, r.clientphone, r.pickup, r.dropoff, r.vehicle].map(x => String(x).toLowerCase()).join(' ');
      const okQ   = !q   || blob.includes(q);
      const okSt  = !st  || String(r.status).toLowerCase() === st;
      const okPay = !pay || String(r.paymentstatus).toLowerCase() === pay;
      return okQ && okSt && okPay;
    });

    // Mise à jour des stats (amélioration C)
    const eur = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
    const allRows = rows;
    if (document.getElementById('statTotal'))   document.getElementById('statTotal').textContent   = allRows.length;
    if (document.getElementById('statPending')) document.getElementById('statPending').textContent = allRows.filter(r => r.status === 'pending').length;
    if (document.getElementById('statConfirmed')) document.getElementById('statConfirmed').textContent = allRows.filter(r => r.status === 'confirmed').length;
    if (document.getElementById('statCA'))      document.getElementById('statCA').textContent      = eur(allRows.reduce((s, r) => s + (Number(r.priceeur) || 0), 0));

    const body  = document.getElementById('reservationsBody');
    const empty = document.getElementById('reservationsEmpty');
    body.innerHTML = '';
    if (!filtered.length) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    const dt = iso => { try { return new Date(iso).toLocaleString('fr-FR'); } catch { return String(iso); } };

    // Liste chauffeurs pour le select assignation
    const drivers = JSON.parse(localStorage.getItem('shvipdrivers') || '[]');
    const driverOptions = `<option value="">— Non assigné</option>` + drivers.map(d =>
      `<option value="${d.id}">${d.firstname} ${d.lastname}</option>`
    ).join('');

    filtered.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'border-t border-white/10 hover:bg-white/5';
      tr.innerHTML = `
        <td class="p-3 text-xs">${dt(r.datetime)}</td>
        <td class="p-3">
          <div class="font-medium">${String(r.clientname)}</div>
          <div class="text-xs text-A8B0C2">${String(r.clientemail)}</div>
        </td>
        <td class="p-3">
          <div class="font-medium">${String(r.pickup)}</div>
          <div class="text-xs text-A8B0C2">→ ${String(r.dropoff)}</div>
        </td>
        <td class="p-3">
          <select onchange="app.assignDriver('${r.id}', this.value)" class="px-2 py-1 rounded-lg bg-white/5 text-white text-xs outline-none border border-white/10 hover:border-D6B15E">
            ${driverOptions.replace(`value="${r.driverid || ''}"`, `value="${r.driverid || ''}" selected`)}
          </select>
        </td>
        <td class="p-3">${String(r.vehicle || 'berline')}</td>
        <td class="p-3 font-semibold text-D6B15E">${eur(r.priceeur)}</td>
        <td class="p-3">${this.badgePay(r.paymentstatus)}</td>
        <td class="p-3">${this.badgeStatus(r.status)}</td>
        <td class="p-3 text-right">
          <div class="flex items-center justify-end gap-1 flex-wrap">
            <button onclick="app.editReservation('${r.id}')" class="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs hover:bg-blue-500/30" title="Modifier">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="app.setReservationStatus('${r.id}','confirmed')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs">Confirmer</button>
            <button onclick="app.setReservationStatus('${r.id}','completed')" class="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs">Terminer</button>
            <button onclick="app.openQuoteFromReservation('${r.id}')" class="px-2 py-1 rounded-lg gold-gradient text-black text-xs font-semibold"><i class="fas fa-link mr-1"></i>Devis+Stripe</button>
            <button onclick="app.deleteReservation('${r.id}')" class="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30" title="Supprimer">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;
      body.appendChild(tr);
    });
  },

  // NOUVEAU — Assigner chauffeur (amélioration B)
  async assignDriver(reservationId, driverId) {
    const drivers = JSON.parse(localStorage.getItem('shvipdrivers') || '[]');
    const driver  = drivers.find(d => d.id === driverId);
    // Mettre à jour localement dans state
    const r = state.reservations.find(x => x.id === reservationId);
    if (r) r.driverid = driverId;
    // Appel API pour persister
    try {
      await this.apiCall('admin-reservations-update', {
        method: 'POST',
        body: JSON.stringify({ id: reservationId, driverid: driverId })
      });
      this.showToast(driver ? `Chauffeur ${driver.firstname} assigné ✓` : 'Chauffeur retiré', 'success');
    } catch(e) {
      this.showToast('Assignation sauvegardée localement', 'warning');
    }
    this.renderReservations();
  },

  // NOUVEAU — Modifier réservation (amélioration A)
  editReservation(id) {
    const r = state.reservations.find(x => x.id === id);
    if (!r) return;
    // Pré-remplir le modal existant
    document.getElementById('resClientName').value  = r.clientname  || '';
    document.getElementById('resClientEmail').value = r.clientemail || '';
    document.getElementById('resClientPhone').value = r.clientphone || '';
    document.getElementById('resPickup').value      = r.pickup      || '';
    document.getElementById('resDropoff').value     = r.dropoff     || '';
    document.getElementById('resDatetime').value    = r.datetime    ? r.datetime.slice(0, 16) : '';
    document.getElementById('resVehicle').value     = r.vehicle     || 'berline';
    document.getElementById('resPrice').value       = r.priceeur    || '';
    document.getElementById('resNotes').value       = r.notes       || '';
    // Stocker l'id en cours d'édition
    state._editingReservationId = id;
    // Changer le titre du modal
    const btn = document.querySelector('#modal-reservation button[onclick="app.createReservationFromModal()"]');
    if (btn) { btn.textContent = 'Mettre à jour'; btn.onclick = () => app.updateReservationFromModal(); }
    this.showModal('reservation');
  },

  // NOUVEAU — Mettre à jour une réservation
  async updateReservationFromModal() {
    const id = state._editingReservationId;
    if (!id) return;
    const v = name => document.getElementById(name)?.value?.trim();
    const payload = {
      id,
      clientname:  v('resClientName'),
      clientemail: v('resClientEmail'),
      clientphone: v('resClientPhone'),
      pickup:      v('resPickup'),
      dropoff:     v('resDropoff'),
      datetime:    v('resDatetime'),
      vehicle:     v('resVehicle') || 'berline',
      priceeur:    Number(v('resPrice')) || 0,
      notes:       v('resNotes'),
    };
    const res  = await this.apiCall('admin-reservations-update', { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.ok) { this.showToast(data.error || 'Erreur', 'error'); return; }
    this.closeModal('reservation');
    state._editingReservationId = null;
    this.showToast('Réservation mise à jour ✓', 'success');
    await this.refreshReservations();
  },

  // NOUVEAU — Supprimer réservation (amélioration A)
  async deleteReservation(id) {
    if (!confirm('Supprimer cette réservation ? Cette action est irréversible.')) return;
    try {
      await this.apiCall('admin-reservations-update', {
        method: 'POST',
        body: JSON.stringify({ id, status: 'cancelled', deleted: true })
      });
      state.reservations = state.reservations.filter(r => r.id !== id);
      this.renderReservations();
      this.showToast('Réservation supprimée', 'success');
    } catch(e) {
      this.showToast('Erreur lors de la suppression', 'error');
    }
  },
