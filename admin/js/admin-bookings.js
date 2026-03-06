import { apiRequest } from "./admin-api.js";

export async function loadBookings() {
  const container = document.getElementById("bookingsTable");
  if (!container) return;

  container.innerHTML = "<p>Chargement...</p>";

  try {
    const data = await apiRequest("admin-get-bookings");
    const items = data.bookings || [];

    if (!items.length) {
      container.innerHTML = "<p>Aucune réservation trouvée.</p>";
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Départ</th>
            <th>Arrivée</th>
            <th>Date</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.clientName || "-"}</td>
              <td>${item.pickup || "-"}</td>
              <td>${item.dropoff || "-"}</td>
              <td>${item.date || "-"}</td>
              <td>${item.status || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    container.innerHTML = `<p>${error.message}</p>`;
  }
}