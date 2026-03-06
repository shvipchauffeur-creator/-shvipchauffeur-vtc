import { CONFIG } from './config.js';
import { state } from './state.js';
import { login, logout, verifyToken } from './auth.js';
import { bindNavActive, closeModal, setPageHeader, showModal, showToast, syncEnvironmentBadge, updatePriceFields, setupDepositCalculation } from './ui.js';
import { toggleNotifications, updateNotifications, readNotification, markAllRead, seedNotifications } from './notifications.js';
import { loadDashboard } from './dashboard.js';
import { loadReservations, refreshReservations, setReservationStatus, openQuoteFromReservation, createReservationFromModal } from './reservations.js';
import { loadPayments, loadQuotes, loadInvoices, submitQuote, viewQuote } from './commerce.js';
import { loadDrivers, saveDriver, editDriver, toggleDriverStatus, deleteDriver, filterDrivers } from './drivers.js';
import { loadStats } from './stats.js';
import { loadCalendar, changeWeek, loadRides, loadClients, loadSettings } from './pages.js';

const titles = {
  dashboard: ['Tableau de bord', 'Vue d'ensemble temps réel'],
  calendar: ['Planning Chauffeurs', 'Gestion des disponibilités'],
  rides: ['Courses en direct', 'Suivi temps réel'],
  payments: ['Paiements Stripe', 'Transactions en ligne'],
  quotes: ['Devis', 'Propositions tarifaires'],
  invoices: ['Factures', 'Facturation clients'],
  drivers: ['Chauffeurs', 'Gestion des prestataires'],
  clients: ['Clients', 'Base de données clients'],
  stats: ['Statistiques', 'Analytics et rapports'],
  settings: ['Configuration', 'Paramètres système'],
  reservations: ['Réservations', 'Gestion des réservations']
};

async function loadPageData(page) {
  switch (page) {
    case 'dashboard': return loadDashboard();
    case 'calendar': return loadCalendar();
    case 'rides': return loadRides();
    case 'reservations': return loadReservations();
    case 'payments': return loadPayments();
    case 'quotes': return loadQuotes();
    case 'invoices': return loadInvoices();
    case 'drivers': return loadDrivers();
    case 'clients': return loadClients();
    case 'stats': return loadStats();
    case 'settings': return loadSettings();
    default: return loadDashboard();
  }
}

function navigate(page) {
  state.currentPage = page;
  bindNavActive(page);
  const [title, subtitle] = titles[page] || titles.dashboard;
  setPageHeader(title, subtitle);
  loadPageData(page).catch((error) => {
    showToast(error.message || 'Erreur de chargement', 'error');
  });
}

function exportData(type) {
  showToast(`Export ${type} démarré...`, 'info');
  closeModal('export');
  setTimeout(() => {
    const data = { type, date: new Date().toISOString(), items: [] };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shvip_export_${type}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export téléchargé', 'success');
  }, 600);
}

function refreshData() {
  return loadPageData(state.currentPage);
}

function init() {
  syncEnvironmentBadge(CONFIG.isLocal);
  setupDepositCalculation();
  updatePriceFields();
  seedNotifications();

  const savedToken = sessionStorage.getItem('shvip_admin_token');
  if (savedToken) {
    verifyToken(savedToken, () => navigate('dashboard'));
  }

  window.app = {
    init,
    login: (e) => login(e, () => navigate('dashboard')),
    logout,
    navigate,
    loadPageData,
    changeWeek,
    loadDashboard,
    loadCalendar,
    loadRides,
    loadReservations,
    refreshReservations,
    setReservationStatus,
    openQuoteFromReservation,
    createReservationFromModal,
    loadPayments,
    loadQuotes,
    loadInvoices,
    loadDrivers,
    loadClients,
    loadStats,
    loadSettings,
    submitQuote,
    viewQuote,
    saveDriver,
    editDriver,
    toggleDriverStatus,
    deleteDriver,
    filterDrivers,
    toggleNotifications,
    updateNotifications,
    readNotification,
    markAllRead,
    exportData,
    showModal,
    closeModal,
    updatePriceFields,
    showToast,
    refreshData
  };
}

init();
