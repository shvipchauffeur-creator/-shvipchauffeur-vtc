import { protectAdminPage, logout } from "./admin-auth.js";
import { bindSidebarNavigation } from "./admin-ui.js";
import { loadDashboard } from "./admin-dashboard.js";
import { loadBookings } from "./admin-bookings.js";

document.addEventListener("DOMContentLoaded", async () => {
  protectAdminPage();
  bindSidebarNavigation();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  await loadDashboard();
  await loadBookings();
});