document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const status = document.getElementById('loginStatus');
  const btn = document.getElementById('loginBtn');
  btn.addEventListener('click', async (e) => {
    status.style.display = 'block';
    status.textContent = 'Logging in...';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const res = await fetch('/api/login', {
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
        window.location.href = '/index.html?login=success';
      } else {
        status.textContent = 'Login failed';
      }
    } catch (err) {
      console.error('Login error', err);
      status.textContent = 'Login error. Try again.';
    }
  });
});