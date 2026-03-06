import { apiRequest } from "./admin-api.js";

export async function loadDashboard() {
  const container = document.getElementById("kpiCards");
  if (!container) return;

  container.innerHTML = "<p>Chargement...</p>";

  try {
    const data = await apiRequest("admin-get-dashboard");

    container.innerHTML = `
      <div class="kpi-card">Demandes : ${data.totalBookings ?? 0}</div>
      <div class="kpi-card">Devis : ${data.totalQuotes ?? 0}</div>
      <div class="kpi-card">Paiements : ${data.totalPayments ?? 0}</div>
      <div class="kpi-card">Chauffeurs : ${data.totalDrivers ?? 0}</div>
    `;
  } catch (error) {
    container.innerHTML = `<p>${error.message}</p>`;
  }
}