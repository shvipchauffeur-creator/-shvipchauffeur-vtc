import { CONFIG } from './config.js';
import { state } from './state.js';
import { qs } from './utils.js';
import { showToast } from './ui.js';

export async function verifyToken(token, onSuccess) {
  const errorDiv = qs('loginError');
  try {
    const response = await fetch(`${CONFIG.baseUrl}/admin-list-payments?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      state.token = token;
      sessionStorage.setItem('shvip_admin_token', token);
      qs('loginScreen')?.classList.add('hidden');
      qs('mainApp')?.classList.remove('hidden');
      qs('mainApp')?.classList.add('flex');
      if (errorDiv) errorDiv.classList.add('hidden');
      showToast('Authentification réussie', 'success');
      onSuccess?.();
    } else {
      if (errorDiv) {
        errorDiv.textContent = 'Token invalide. Vérifiez vos variables d'environnement Netlify.';
        errorDiv.classList.remove('hidden');
      }
      sessionStorage.removeItem('shvip_admin_token');
    }
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = 'Erreur de connexion au serveur.';
      errorDiv.classList.remove('hidden');
    }
  }
}

export function login(event, onSuccess) {
  event.preventDefault();
  const token = qs('adminToken')?.value.trim();
  const errorDiv = qs('loginError');
  if (!token) {
    errorDiv?.classList.remove('hidden');
    return;
  }
  verifyToken(token, onSuccess);
}

export function logout() {
  state.token = null;
  sessionStorage.removeItem('shvip_admin_token');
  window.location.reload();
}
