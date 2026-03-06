import { state } from './state.js';
import { qs } from './utils.js';

export function seedNotifications() {
  state.notifications = [
    { id: 'n1', title: 'Dashboard prêt', message: 'Structure modulaire chargée.', time: new Date().toISOString(), read: false },
    { id: 'n2', title: 'Admin sécurisé', message: 'Session admin active.', time: new Date().toISOString(), read: true }
  ];
  updateNotifications();
}

export function toggleNotifications() {
  const panel = qs('notificationPanel');
  if (!panel) return;
  panel.classList.toggle('active');
  if (panel.classList.contains('active')) {
    state.notifications.forEach((n) => { n.read = true; });
    updateNotifications();
  }
}

export function updateNotifications() {
  const list = qs('notificationsList');
  const count = state.notifications.filter((n) => !n.read).length;
  const badge = qs('notifCount');
  const notifBtnBadge = qs('notifBadge');
  if (badge) badge.textContent = String(count);
  if (notifBtnBadge) {
    notifBtnBadge.textContent = String(count);
    notifBtnBadge.classList.toggle('hidden', count === 0);
  }
  if (!list) return;
  list.innerHTML = state.notifications.map((n) => `
    <div class="notification-item ${n.read ? '' : 'new'}">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold text-white text-sm">${n.title}</div>
          <div class="text-xs text-[#A8B0C2] mt-1">${n.message}</div>
        </div>
        <button onclick="app.readNotification('${n.id}')" class="text-[#A8B0C2] hover:text-white text-xs">Lu</button>
      </div>
    </div>`).join('') || '<div class="text-sm text-[#A8B0C2]">Aucune notification</div>';
}

export function readNotification(id) {
  const notif = state.notifications.find((n) => n.id === id);
  if (notif) notif.read = true;
  updateNotifications();
}

export function markAllRead() {
  state.notifications.forEach((n) => { n.read = true; });
  updateNotifications();
}
