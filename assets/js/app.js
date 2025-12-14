/* ========================================
   NeuroTrack Dashboard Application Logic
   Data Loading and UI Updates
   ======================================== */

// Configuration
const DATA_PATH = '../data/doctor_dashboard_data.json';

/**
 * Main initialization function
 */
async function initializeDashboard() {
  try {
    // Load dashboard data
    const data = await loadDashboardData();
    
    // Update summary statistics
    updateSummaryStats(data.summary_stats);
    
    // Render recent alerts
    renderAlerts(data.recent_alerts);
    
    // Initialize chart visualization
    if (window.ChartModule) {
      window.ChartModule.initializeChart(data);
      window.ChartModule.setupChartFilters();
    }
    
    // Setup profile dropdown
    setupProfileDropdown();
    
    // Load user info from localStorage
    loadUserInfo();
    
  } catch (error) {
    console.error('Dashboard initialization failed:', error);
    showErrorNotification('Failed to load dashboard data. Please refresh the page.');
  }
}

/**
 * Load dashboard data from JSON file
 * @returns {Promise<Object>} Dashboard data
 */
async function loadDashboardData() {
  const response = await fetch(DATA_PATH);
  
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update summary statistic cards
 * @param {Object} stats - Summary statistics
 */
function updateSummaryStats(stats) {
  // Total Patients
  const totalPatientsEl = document.getElementById('statTotalPatients');
  if (totalPatientsEl) {
    totalPatientsEl.textContent = stats.total_patients || '0';
  }
  
  // Critical Alerts
  const criticalAlertsEl = document.getElementById('statCriticalAlerts');
  if (criticalAlertsEl) {
    criticalAlertsEl.textContent = stats.critical_alerts || '0';
  }
  
  // Today's Appointments
  const appointmentsEl = document.getElementById('statTodaysAppointments');
  if (appointmentsEl) {
    appointmentsEl.textContent = stats.todays_appointments || '0';
  }
  
  // Average Recovery Rate
  const recoveryRateEl = document.getElementById('statAvgRecovery');
  if (recoveryRateEl) {
    recoveryRateEl.textContent = stats.avg_recovery_rate || '--';
  }
}

/**
 * Render alerts in the alerts section
 * @param {Array<Object>} alerts - Alert objects
 */
function renderAlerts(alerts) {
  const alertsList = document.getElementById('alertsList');
  
  if (!alertsList) return;
  
  // Clear placeholder
  alertsList.innerHTML = '';
  
  if (!alerts || alerts.length === 0) {
    alertsList.innerHTML = '<div class="alert-placeholder">No recent alerts</div>';
    return;
  }
  
  // Render each alert
  alerts.forEach(alert => {
    const alertItem = createAlertElement(alert);
    alertsList.appendChild(alertItem);
  });
}

/**
 * Create alert DOM element
 * @param {Object} alert - Alert data
 * @returns {HTMLElement} Alert element
 */
function createAlertElement(alert) {
  const div = document.createElement('div');
  div.className = `alert-item alert-item--${alert.severity}`;
  
  const severityClass = getSeverityClass(alert.severity);
  const icon = getAlertIcon(alert.type);
  const timeAgo = formatTimeAgo(alert.timestamp);
  
  div.innerHTML = `
    <div class="alert-icon ${severityClass}">
      ${icon}
    </div>
    <div class="alert-content">
      <p class="alert-patient">${escapeHtml(alert.patient)}</p>
      <p class="alert-message">${escapeHtml(alert.message)}</p>
    </div>
    <div class="alert-time">${timeAgo}</div>
  `;
  
  return div;
}

/**
 * Get CSS class for alert severity
 * @param {string} severity - Alert severity level
 * @returns {string} CSS class name
 */
function getSeverityClass(severity) {
  const severityMap = {
    'high': 'alert-icon--danger',
    'critical': 'alert-icon--danger',
    'medium': 'alert-icon--warning',
    'low': 'alert-icon--info'
  };
  return severityMap[severity] || 'alert-icon--info';
}

/**
 * Get SVG icon for alert type
 * @param {string} type - Alert type
 * @returns {string} SVG markup
 */
function getAlertIcon(type) {
  const icons = {
    declining_motor: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clip-rule="evenodd"/></svg>',
    declining_cognitive: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
    missed_session: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
    default: '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
  };
  return icons[type] || icons.default;
}

/**
 * Format timestamp to relative time
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time string
 */
function formatTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Load user information from localStorage
 */
function loadUserInfo() {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return;
  
  try {
    const user = JSON.parse(userStr);
    
    // Update profile name
    const nameEl = document.getElementById('userName');
    if (nameEl && user.name) {
      nameEl.textContent = user.name;
    }
    
    // Update profile avatar initials
    const avatarEl = document.querySelector('.profile-avatar');
    if (avatarEl && user.name) {
      const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      avatarEl.textContent = initials;
    }
    
    // Update role display
    const roleEl = document.querySelector('.profile-role');
    if (roleEl && user.role) {
      roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
  } catch (error) {
    console.error('Failed to parse user data:', error);
  }
}

/**
 * Setup profile dropdown toggle
 */
function setupProfileDropdown() {
  const profileBtn = document.querySelector('.profile-btn');
  const profileMenu = document.querySelector('.profile-menu');
  
  if (!profileBtn || !profileMenu) return;
  
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.style.display = profileMenu.style.display === 'block' ? 'none' : 'block';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    profileMenu.style.display = 'none';
  });
  
  // Prevent dropdown from closing when clicking inside
  profileMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

/**
 * Handle user logout
 */
function handleLogout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  window.location.href = 'login.html';
}

/**
 * Show error notification
 * @param {string} message - Error message
 */
function showErrorNotification(message) {
  // Simple alert for now - can be replaced with custom notification UI
  alert(message);
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
  initializeDashboard();
}

// Export functions for external use
if (typeof window !== 'undefined') {
  window.DashboardApp = {
    initializeDashboard,
    handleLogout
  };
}
