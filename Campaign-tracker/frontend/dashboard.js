const API_URL = "/api/campaigns";

async function loadDashboard() {
  try {
    const msgEl = document.getElementById('dashboardMessage');
    if (msgEl) { msgEl.textContent = 'Loading...'; msgEl.style.color = '#333'; }

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const campaigns = await res.json();
    console.log('Dashboard fetched campaigns:', campaigns);

    // Update dashboard counts (safely check elements)
    const totalEl = document.getElementById("totalCount");
    const activeEl = document.getElementById("activeCount");
    const pausedEl = document.getElementById("pausedCount");
    const completedEl = document.getElementById("completedCount");

    if (totalEl) totalEl.textContent = (campaigns && campaigns.length) || 0;
    if (activeEl) activeEl.textContent = (campaigns && campaigns.filter(c => c.status === "Active").length) || 0;
    if (pausedEl) pausedEl.textContent = (campaigns && campaigns.filter(c => c.status === "Paused").length) || 0;
    if (completedEl) completedEl.textContent = (campaigns && campaigns.filter(c => c.status === "Completed").length) || 0;

    if (msgEl) { msgEl.textContent = ''; }

  } catch (err) {
    console.error("Error loading dashboard:", err);
    const msgEl = document.getElementById('dashboardMessage');
    if (msgEl) { msgEl.textContent = 'Error loading dashboard: ' + (err.message || err); msgEl.style.color = '#b00'; }
  }
}

// Run after page load — if the script is loaded after DOMContentLoaded already fired,
// calling addEventListener would miss the event, so handle both cases.
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", loadDashboard);
} else {
  // DOM already ready
  loadDashboard();
}
