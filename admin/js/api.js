import { CONFIG } from './config.js';
import { state } from './state.js';

export async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${CONFIG.baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  return response;
}

export async function getJson(endpoint, options = {}) {
  const response = await apiCall(endpoint, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Erreur API (${response.status})`);
  }
  return data;
}
