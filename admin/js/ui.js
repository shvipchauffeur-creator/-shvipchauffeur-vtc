import { qs } from './utils.js';

export function setPageHeader(title, subtitle) {
  const titleEl = qs('pageTitle');
  const subtitleEl = qs('pageSubtitle');
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
}

export function showModal(name) {
  const modal = qs(`modal-${name}`);
  if (modal) modal.classList.add('active');
}

export function closeModal(name) {
  const modal = qs(`modal-${name}`);
  if (modal) modal.classList.remove('active');
}

export function showToast(message, type = 'info') {
  const toast = qs('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

export function setContent(html) {
  const content = qs('content');
  if (content) content.innerHTML = html;
}

export function bindNavActive(page) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.remove('active');
    el.classList.add('text-[#A8B0C2]');
  });

  const activeBtn = Array.from(document.querySelectorAll('.nav-item')).find((el) =>
    el.getAttribute('onclick')?.includes(`'${page}'`)
  );

  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-[#A8B0C2]');
  }
}

export function updatePriceFields() {
  const mode = qs('pricingMode')?.value;
  const depositFields = qs('depositFields');
  if (!depositFields) return;
  depositFields.classList.toggle('hidden', mode !== 'deposit');
}

export function setupDepositCalculation() {
  document.addEventListener('input', (e) => {
    if (e.target.id === 'depositAmount' || e.target.id === 'totalAmount') {
      const total = parseFloat(qs('totalAmount')?.value) || 0;
      const deposit = parseFloat(qs('depositAmount')?.value) || 0;
      const balanceInput = qs('balanceAmount');
      if (balanceInput) {
        balanceInput.value = (total - deposit).toFixed(2);
      }
    }
  });
}

export function syncEnvironmentBadge(isLocal) {
  const envIndicator = qs('envIndicator');
  const apiStatus = qs('apiStatus');
  const modeLabel = isLocal ? 'Local' : 'Production';
  if (envIndicator) envIndicator.textContent = modeLabel;
  if (apiStatus) {
    apiStatus.className = `flex items-center gap-2 text-xs px-3 py-1 rounded-full ${isLocal ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#10B981]/20 text-[#10B981]'}`;
    apiStatus.innerHTML = `<span class="w-2 h-2 rounded-full ${isLocal ? 'bg-[#F59E0B]' : 'bg-[#10B981]'} animate-pulse"></span>${isLocal ? 'API Locale' : 'API Connectée'}`;
  }
}
