/**
 * Parking Slot Management Board - Client-side JavaScript
 * Handles API calls, DOM rendering, modal interactions, and filtering.
 */

// Application State & Configuration
const API_BASE = (window.location.protocol.startsWith('http') && window.location.port === '3000') 
  ? '' 
  : 'http://localhost:3000';

let parkingSlots = [];
let activeFilter = 'all'; // 'all' | 'available' | 'occupied'
let searchQuery = '';
let targetReleaseSlotId = null;

// Bootstrap Modal Instances
let parkModalInstance = null;
let releaseModalInstance = null;
let liveToastInstance = null;

// DOM Elements
const slotsGrid = document.getElementById('slotsGrid');
const emptyState = document.getElementById('emptyState');
const statTotal = document.getElementById('statTotal');
const statAvailable = document.getElementById('statAvailable');
const statOccupied = document.getElementById('statOccupied');

const filterCountAll = document.getElementById('filterCountAll');
const filterCountAvailable = document.getElementById('filterCountAvailable');
const filterCountOccupied = document.getElementById('filterCountOccupied');

const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('searchInput');
const btnClearSearch = document.getElementById('btnClearSearch');
const btnRefresh = document.getElementById('btnRefresh');

const parkForm = document.getElementById('parkForm');
const slotSelect = document.getElementById('slotSelect');
const vehicleNumberInput = document.getElementById('vehicleNumberInput');
const vehicleTypeSelect = document.getElementById('vehicleTypeSelect');
const ownerNameInput = document.getElementById('ownerNameInput');
const btnSubmitPark = document.getElementById('btnSubmitPark');

const releaseModalSlotNum = document.getElementById('releaseModalSlotNum');
const releaseModalVehicleNum = document.getElementById('releaseModalVehicleNum');
const releaseModalOwner = document.getElementById('releaseModalOwner');
const btnConfirmRelease = document.getElementById('btnConfirmRelease');

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Bootstrap instances
  parkModalInstance = new bootstrap.Modal(document.getElementById('parkModal'));
  releaseModalInstance = new bootstrap.Modal(document.getElementById('releaseModal'));
  liveToastInstance = new bootstrap.Toast(document.getElementById('liveToast'), { delay: 4000 });

  // Event Listeners
  setupEventListeners();

  // Load initial data from backend API
  fetchSlots();
});

// ----------------------------------------------------
// EVENT LISTENERS
// ----------------------------------------------------
function setupEventListeners() {
  // Refresh button
  btnRefresh.addEventListener('click', () => {
    const icon = btnRefresh.querySelector('i');
    icon.classList.add('spinning');
    fetchSlots().finally(() => {
      setTimeout(() => icon.classList.remove('spinning'), 500);
    });
  });

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterButtons.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      activeFilter = targetBtn.getAttribute('data-filter');
      renderSlots();
    });
  });

  // Search Input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderSlots();
  });

  // Clear Search
  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    renderSlots();
  });

  // Reset Filters from empty state
  const btnResetFilters = document.getElementById('btnResetFilters');
  if (btnResetFilters) {
    btnResetFilters.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      activeFilter = 'all';
      filterButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
      });
      renderSlots();
    });
  }

  // Park Vehicle Form Submission
  parkForm.addEventListener('submit', handleParkSubmit);

  // Confirm Slot Release
  btnConfirmRelease.addEventListener('click', handleConfirmRelease);

  // When Park Modal opens, refresh available slots dropdown
  document.getElementById('parkModal').addEventListener('show.bs.modal', () => {
    populateSlotDropdown();
  });

  // Clean form validation states when modal closes
  document.getElementById('parkModal').addEventListener('hidden.bs.modal', () => {
    parkForm.reset();
    parkForm.classList.remove('was-validated');
  });
}

// ----------------------------------------------------
// API CALLS
// ----------------------------------------------------

/**
 * Fetch all slots from GET /api/slots
 */
async function fetchSlots() {
  try {
    const response = await fetch(`${API_BASE}/api/slots`);
    if (!response.ok) throw new Error('Failed to fetch parking slots');

    const result = await response.json();
    if (result.success) {
      parkingSlots = result.data;
      updateStats(result.stats);
      renderSlots();
      populateSlotDropdown();
    }
  } catch (error) {
    console.error('Error fetching slots:', error);
    showToast('Failed to connect to parking server. Please verify backend is running on port 3000.', 'danger');
  }
}

/**
 * Handle form submit to park a vehicle: POST /api/slots/:id/park
 */
async function handleParkSubmit(e) {
  e.preventDefault();

  if (!parkForm.checkValidity()) {
    e.stopPropagation();
    parkForm.classList.add('was-validated');
    return;
  }

  const selectedSlotId = slotSelect.value;
  const vehicleNumber = vehicleNumberInput.value.trim();
  const vehicleType = vehicleTypeSelect.value;
  const ownerName = ownerNameInput.value.trim();

  // Disable button and show spinner
  btnSubmitPark.disabled = true;
  const originalBtnHtml = btnSubmitPark.innerHTML;
  btnSubmitPark.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Parking...`;

  try {
    const response = await fetch(`${API_BASE}/api/slots/${selectedSlotId}/park`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vehicleNumber,
        vehicleType,
        ownerName
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Unable to park vehicle.');
    }

    // Success
    showToast(result.message, 'success');
    parkModalInstance.hide();
    parkForm.reset();
    parkForm.classList.remove('was-validated');

    // Refresh state
    await fetchSlots();

  } catch (error) {
    showToast(error.message, 'danger');
  } finally {
    btnSubmitPark.disabled = false;
    btnSubmitPark.innerHTML = originalBtnHtml;
  }
}

/**
 * Handle confirmation of slot release: POST /api/slots/:id/release
 */
async function handleConfirmRelease() {
  if (!targetReleaseSlotId) return;

  btnConfirmRelease.disabled = true;
  const originalHtml = btnConfirmRelease.innerHTML;
  btnConfirmRelease.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Releasing...`;

  try {
    const response = await fetch(`${API_BASE}/api/slots/${targetReleaseSlotId}/release`, {
      method: 'POST'
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Unable to release slot.');
    }

    showToast(result.message, 'success');
    releaseModalInstance.hide();
    targetReleaseSlotId = null;

    // Refresh state
    await fetchSlots();

  } catch (error) {
    showToast(error.message, 'danger');
  } finally {
    btnConfirmRelease.disabled = false;
    btnConfirmRelease.innerHTML = originalHtml;
  }
}

// ----------------------------------------------------
// UI RENDERING & DOM UPDATES
// ----------------------------------------------------

/**
 * Update top overview statistics and filter badge counts
 */
function updateStats(stats) {
  if (!stats) return;

  statTotal.textContent = stats.total;
  statAvailable.textContent = stats.available;
  statOccupied.textContent = stats.occupied;

  filterCountAll.textContent = stats.total;
  filterCountAvailable.textContent = stats.available;
  filterCountOccupied.textContent = stats.occupied;
}

/**
 * Populate slot select dropdown in the Park Vehicle modal
 */
function populateSlotDropdown(selectedId = null) {
  slotSelect.innerHTML = '<option value="" disabled selected>Choose an available slot...</option>';

  const availableSlots = parkingSlots.filter(s => !s.isOccupied);

  if (availableSlots.length === 0) {
    slotSelect.innerHTML = '<option value="" disabled selected>No available slots right now</option>';
    return;
  }

  availableSlots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot.id;
    option.textContent = `Slot ${slot.slotNumber}`;
    if (selectedId && slot.id === parseInt(selectedId, 10)) {
      option.selected = true;
    }
    slotSelect.appendChild(option);
  });
}

/**
 * Render parking slot cards into the grid
 */
function renderSlots() {
  slotsGrid.innerHTML = '';

  // Filter slots
  const filteredSlots = parkingSlots.filter(slot => {
    // 1. Status Filter
    if (activeFilter === 'available' && slot.isOccupied) return false;
    if (activeFilter === 'occupied' && !slot.isOccupied) return false;

    // 2. Search Filter
    if (searchQuery) {
      const matchSlot = slot.slotNumber.toLowerCase().includes(searchQuery);
      const matchVehicle = slot.vehicle ? slot.vehicle.vehicleNumber.toLowerCase().includes(searchQuery) : false;
      const matchOwner = slot.vehicle ? slot.vehicle.ownerName.toLowerCase().includes(searchQuery) : false;
      const matchType = slot.vehicle ? slot.vehicle.vehicleType.toLowerCase().includes(searchQuery) : false;

      if (!matchSlot && !matchVehicle && !matchOwner && !matchType) {
        return false;
      }
    }

    return true;
  });

  // Check empty state
  if (filteredSlots.length === 0) {
    emptyState.classList.remove('d-none');
  } else {
    emptyState.classList.add('d-none');
  }

  // Create slot cards
  filteredSlots.forEach(slot => {
    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = `card h-100 slot-card shadow-sm ${slot.isOccupied ? 'occupied' : 'available'}`;

    if (slot.isOccupied) {
      // Occupied Card Template
      const parkedTimeStr = formatRelativeTime(slot.vehicle.parkedAt);
      const vehicleIcon = getVehicleIcon(slot.vehicle.vehicleType);

      card.innerHTML = `
        <div class="slot-header d-flex align-items-center justify-content-between">
          <span class="slot-title text-dark">
            <i class="bi bi-geo-alt-fill text-danger me-1"></i>Slot ${slot.slotNumber}
          </span>
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1">
            <i class="bi bi-lock-fill me-1"></i>Occupied
          </span>
        </div>
        <div class="card-body p-3 d-flex flex-column justify-content-between">
          <div>
            <div class="mb-2">
              <span class="license-plate shadow-xs">
                ${escapeHtml(slot.vehicle.vehicleNumber)}
              </span>
            </div>
            
            <div class="small text-secondary mb-1 d-flex align-items-center gap-1">
              <i class="${vehicleIcon} text-primary"></i>
              <strong class="text-dark">${escapeHtml(slot.vehicle.vehicleType)}</strong>
            </div>

            <div class="small text-secondary mb-2 d-flex align-items-center gap-1">
              <i class="bi bi-person-fill text-muted"></i>
              <span>${escapeHtml(slot.vehicle.ownerName)}</span>
            </div>

            <div class="text-muted extra-small" style="font-size: 0.78rem;">
              <i class="bi bi-clock me-1"></i>Parked: ${parkedTimeStr}
            </div>
          </div>

          <div class="pt-3 border-top mt-3">
            <button 
              class="btn btn-outline-danger btn-sm w-100 rounded-pill fw-semibold d-flex align-items-center justify-content-center gap-1"
              onclick="openReleaseModal(${slot.id})"
            >
              <i class="bi bi-box-arrow-right"></i>
              <span>Release Slot</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // Available Card Template
      card.innerHTML = `
        <div class="slot-header d-flex align-items-center justify-content-between">
          <span class="slot-title text-dark">
            <i class="bi bi-geo-alt-fill text-success me-1"></i>Slot ${slot.slotNumber}
          </span>
          <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1">
            <i class="bi bi-check-circle-fill me-1"></i>Available
          </span>
        </div>
        <div class="card-body p-3 text-center d-flex flex-column justify-content-between">
          <div class="py-2">
            <div class="vacant-icon-circle mb-2 shadow-xs">
              <i class="bi bi-p-circle fs-2"></i>
            </div>
            <div class="fw-semibold text-success small">Ready for Parking</div>
            <p class="text-muted small mb-0" style="font-size: 0.8rem;">Space is vacant</p>
          </div>

          <div class="pt-2 border-top mt-2">
            <button 
              class="btn btn-primary btn-sm w-100 rounded-pill fw-semibold shadow-xs d-flex align-items-center justify-content-center gap-1"
              onclick="openParkModalForSlot(${slot.id})"
            >
              <i class="bi bi-plus-circle"></i>
              <span>Park Vehicle</span>
            </button>
          </div>
        </div>
      `;
    }

    col.appendChild(card);
    slotsGrid.appendChild(col);
  });
}

// ----------------------------------------------------
// MODAL ACTIONS (GLOBAL SCOPE HELPERS)
// ----------------------------------------------------

/**
 * Open park modal with a specific slot preselected
 */
window.openParkModalForSlot = function(slotId) {
  populateSlotDropdown(slotId);
  slotSelect.value = slotId;
  parkModalInstance.show();
};

/**
 * Open release confirmation modal
 */
window.openReleaseModal = function(slotId) {
  const slot = parkingSlots.find(s => s.id === slotId);
  if (!slot || !slot.isOccupied) return;

  targetReleaseSlotId = slot.id;
  releaseModalSlotNum.textContent = `Slot ${slot.slotNumber}`;
  releaseModalVehicleNum.textContent = slot.vehicle.vehicleNumber;
  releaseModalOwner.textContent = slot.vehicle.ownerName;

  releaseModalInstance.show();
};

// ----------------------------------------------------
// UTILITY FUNCTIONS
// ----------------------------------------------------

/**
 * Show a toast notification
 */
function showToast(message, type = 'success') {
  const toastEl = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  toastEl.classList.remove('bg-success', 'bg-danger', 'bg-primary', 'bg-warning');

  if (type === 'success') {
    toastEl.classList.add('bg-success');
    toastIcon.className = 'bi bi-check-circle-fill fs-5';
  } else if (type === 'danger') {
    toastEl.classList.add('bg-danger');
    toastIcon.className = 'bi bi-exclamation-triangle-fill fs-5';
  } else {
    toastEl.classList.add('bg-primary');
    toastIcon.className = 'bi bi-info-circle-fill fs-5';
  }

  toastMessage.textContent = message;
  liveToastInstance.show();
}

/**
 * Helper to get Bootstrap vehicle icon
 */
function getVehicleIcon(type) {
  switch ((type || '').toLowerCase()) {
    case 'car':
      return 'bi bi-car-front-fill';
    case 'suv':
      return 'bi bi-truck-front-fill';
    case 'bike':
      return 'bi bi-bicycle';
    case 'ev':
      return 'bi bi-lightning-charge-fill';
    case 'truck':
      return 'bi bi-truck';
    default:
      return 'bi bi-car-front';
  }
}

/**
 * Format relative time or friendly string
 */
function formatRelativeTime(isoString) {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const hours = Math.floor(diffInMinutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Escape string to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
