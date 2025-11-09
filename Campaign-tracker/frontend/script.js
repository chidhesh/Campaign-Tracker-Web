// Determine API base: when the page is served from the backend (same origin)
// use relative paths. When opened via file:// or Live Server (127.0.0.1:5500),
// the backend is likely running on http://localhost:5000 — use that as a fallback.
const API_BASE = (function(){
  // file:// pages have protocol 'file:' -> need to point to backend
  if (location.protocol === 'file:') return 'http://localhost:5000';
  // common Live Server default port
  if (location.hostname === '127.0.0.1' && location.port === '5500') return 'http://localhost:5000';
  // if page is served by backend (same origin), use empty base so relative paths hit same origin
  return '';
})();
const API_URL = API_BASE + '/api/campaigns';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("campaignForm");
  const tableBody = document.querySelector("#campaignTable tbody");
  const hasForm = !!form;
  const hasTable = !!tableBody;

  // If this page has neither the form nor the table, nothing to do here
  if (!hasForm && !hasTable) return;

  // Update dashboard counts if elements exist
  function updateDashboard(campaigns) {
    const totalEl = document.getElementById("totalCount");
    const activeEl = document.getElementById("activeCount");
    const pausedEl = document.getElementById("pausedCount");
    const completedEl = document.getElementById("completedCount");

    if (!totalEl && !activeEl && !pausedEl && !completedEl) return;

    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === "Active").length;
    const paused = campaigns.filter(c => c.status === "Paused").length;
    const completed = campaigns.filter(c => c.status === "Completed").length;

    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (pausedEl) pausedEl.textContent = paused;
    if (completedEl) completedEl.textContent = completed;
  }

  // Load campaigns from server and update table & dashboard (if present)
  async function loadCampaigns() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const campaigns = await res.json();

      // Update dashboard if dashboard elements exist
      updateDashboard(campaigns);

      if (!hasTable) return;

      // Update table
      tableBody.innerHTML = "";
      campaigns.forEach((c) => {
        // Format date as dd/mm/yyyy
        function formatDate(dateStr) {
          const d = new Date(dateStr);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        }

        const row = `
          <tr>
            <td>${c.name}</td>
            <td>${c.client}</td>
            <td>${formatDate(c.startDate)}</td>
            <td>
              <select onchange="updateStatus(${c.id}, this.value)">
          <option ${c.status === "Active" ? "selected" : ""}>Active</option>
          <option ${c.status === "Paused" ? "selected" : ""}>Paused</option>
          <option ${c.status === "Completed" ? "selected" : ""}>Completed</option>
              </select>
            </td>
            <td><button onclick="deleteCampaign(${c.id})">Delete</button></td>
          </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
      });
    } catch (err) {
      console.error("Error loading campaigns:", err);
    }
  }

  // Handle form submission to add a new campaign (if form exists)
  if (hasForm) {
    // prevent native submit just in case
    form.addEventListener('submit', (e) => e.preventDefault());
    const addBtn = document.getElementById('btn');
    if (addBtn) {
      addBtn.addEventListener('click', async () => {
        const newCampaign = {
          name: form.name.value,
          client: form.client.value,
          startDate: form.startDate.value,
          status: form.status.value,
        };
        try {
          const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCampaign),
          });
          if (!res.ok) throw new Error("Failed to add campaign");
          form.reset();
          if (hasTable) loadCampaigns();
        } catch (err) {
          console.error("Error adding campaign:", err);
        }
      });
    }
  }

  // Update campaign status (safe to call even if table isn't present)
  window.updateStatus = async function(id, status) {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      if (hasTable) loadCampaigns();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Delete a campaign (safe to call even if table isn't present)
  window.deleteCampaign = async function(id) {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete campaign");
      if (hasTable) loadCampaigns();
    } catch (err) {
      console.error("Error deleting campaign:", err);
    }
  };

  // Initial load of campaigns (only when table or dashboard is present)
  loadCampaigns();
  
  // About: toggle the `.open` class using IntersectionObserver so the left image
  // opens from the center (clip-path expands) while the section is visible,
  // and closes back (clip-path collapses to center) when it leaves view.
  const about = document.getElementById('about');
  if (about) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            about.classList.add('open');
          } else {
            about.classList.remove('open');
          }
        });
      }, { threshold: [0, 0.15, 0.35, 0.6, 1] });
      io.observe(about);
    } else {
      // Fallback: center-distance check
      function checkAboutFullyVisible() {
        const rect = about.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        const threshold = 100; // px tolerance to consider 'centered'
        if (distance < threshold) about.classList.add('open'); else about.classList.remove('open');
      }
      window.addEventListener('scroll', checkAboutFullyVisible, { passive: true });
      window.addEventListener('resize', checkAboutFullyVisible);
      checkAboutFullyVisible();
    }
  }
  
  // Reveal contact cards if present (ensure they're visible on load)
  const contactCards = document.querySelectorAll('.contact-card');
  contactCards.forEach(card => {
    // remove any inline styles that might hide it, ensure visible
    card.style.transform = '';
    card.style.opacity = '';
  });

  // Contact form handling (local stub since no API endpoint exists)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const statusEl = document.getElementById('contactStatus');
    // prevent native submit
    contactForm.addEventListener('submit', (e) => e.preventDefault());
    const contactSend = document.getElementById('contactSend');
    if (contactSend) contactSend.addEventListener('click', async () => {
      const data = {
        name: contactForm.name?.value || document.getElementById('contactName')?.value,
        email: contactForm.email?.value || document.getElementById('contactEmail')?.value,
        message: contactForm.message?.value || document.getElementById('contactMessage')?.value,
      };

      // Simple front-end validation
      if (!data.name || !data.email || !data.message) {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = 'Please fill in all fields.';
        }
        return;
      }

      // Send to backend API
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.textContent = 'Sending...';
      }

      try {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = 'Sending...';
        }
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Server error');
        const json = await res.json();
        if (statusEl) statusEl.textContent = 'Thanks — your message has been received.';
        contactForm.reset();
      } catch (err) {
        console.error('Contact send failed', err);
        if (statusEl) statusEl.textContent = 'Failed to send message. Please try again later.';
      }
    });
  }
});
