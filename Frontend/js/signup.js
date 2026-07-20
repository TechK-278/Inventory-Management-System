/* ============================================================
   SIGNUP — Signup page handler
   ============================================================ */

var API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const errorEl = document.getElementById('signup-error');
  const submitBtn = document.getElementById('signup-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
      errorEl.textContent = 'Please fill out all fields.';
      errorEl.classList.add('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = 'dashboard.html';
      } else {
        errorEl.textContent = data.message || 'Signup failed.';
        errorEl.classList.add('show');
      }
    } catch (err) {
      errorEl.textContent = 'Network error. Please try again.';
      errorEl.classList.add('show');
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign Up';
  });
});
