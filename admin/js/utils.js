export function escapeHtml(str) {
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(str || '').replace(/[&<>"']/g, m => map[m]);
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR');
}

export function formatMoney(value, cents = false) {
  const amount = Number(value || 0);
  const num = cents ? amount / 100 : amount;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
}

export function qs(id) {
  return document.getElementById(id);
}

export function valueOf(id) {
  return (qs(id)?.value || '').trim();
}

export function skeleton(message = 'Chargement...') {
  return `<div class="flex items-center justify-center h-64"><div class="text-center"><div class="skeleton w-12 h-12 rounded-full mx-auto mb-3"></div><div class="text-sm text-[#A8B0C2]">${escapeHtml(message)}</div></div></div>`;
}
