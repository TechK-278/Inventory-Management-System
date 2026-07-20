/* ============================================================
   AUTH CHECK — Guards protected pages
   Verifies session, redirects to login if absent
   ============================================================ */

var API_BASE = '/api';

async function checkAuth() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) {
      window.location.href = 'login.html';
      return null;
    }
    const data = await res.json();
    if (!data.success) {
      window.location.href = 'login.html';
      return null;
    }
    return data.user;
  } catch (err) {
    window.location.href = 'login.html';
    return null;
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    // Ignore
  }
  window.location.href = 'login.html';
}

/**
 * Initialize the navigation and user info on a protected page.
 * Call this on DOMContentLoaded.
 */
async function initPage() {
  const user = await checkAuth();
  if (!user) return null;

  // Set user info in nav
  const userNameEl = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');
  const userAvatarEl = document.querySelector('.user-avatar');

  if (userNameEl) userNameEl.textContent = user.name;
  if (userRoleEl) userRoleEl.textContent = user.role;
  if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();

  // Set active nav link
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
  document.querySelectorAll('.pegboard-nav .nav-links a').forEach(link => {
    const href = link.getAttribute('href').replace('.html', '').replace('/', '');
    if (href === currentPage || (currentPage === '' && href === 'dashboard')) {
      link.classList.add('active');
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  return user;
}
