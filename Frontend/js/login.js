/* ============================================================
   LOGIN — Login page handler
   ============================================================ */

var API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      errorEl.textContent = 'Please enter both email and password.';
      errorEl.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = 'dashboard.html';
      } else {
        errorEl.textContent = data.message || 'Login failed.';
        errorEl.classList.add('show');
      }
    } catch (err) {
      errorEl.textContent = 'Network error. Please try again.';
      errorEl.classList.add('show');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  });
});
