export function getToken() {
  return localStorage.getItem("admin_token");
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  localStorage.removeItem("admin_token");
  window.location.href = "/admin/login.html";
}

export function protectAdminPage() {
  if (!isLoggedIn()) {
    window.location.href = "/admin/login.html";
  }
}