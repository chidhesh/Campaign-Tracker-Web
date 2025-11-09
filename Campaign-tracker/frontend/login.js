document.addEventListener('DOMContentLoaded', () => {
  // Determine API base (same logic as other frontend scripts)
  const API_BASE = (function(){
    if (location.protocol === 'file:') return 'http://localhost:5000';
    if (location.hostname === '127.0.0.1' && location.port === '5500') return 'http://localhost:5000';
    return '';
  })();

  const form = document.getElementById('loginForm');
  const status = document.getElementById('loginStatus');
  const btn = document.getElementById('loginBtn');
  btn.addEventListener('click', async (e) => {
    status.style.display = 'block';
    status.textContent = 'Logging in...';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch(API_BASE + '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        status.textContent = err.message || 'Login failed';
        return;
      }
      const json = await res.json();
      if (json && json.token) {
        // store token in sessionStorage
        sessionStorage.setItem('authToken', json.token);
        // redirect to index with success
        window.location.href = API_BASE + '/index.html?login=success';
      } else {
        status.textContent = 'Login failed';
      }
    } catch (err) {
      console.error('Login error', err);
      status.textContent = 'Login error. Try again.';
    }
  });
});