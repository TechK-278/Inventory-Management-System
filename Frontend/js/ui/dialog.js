/* ============================================================
   DIALOG — Right-side slide panel (not center modal)
   shadcn-style ARIA + focus trap, vanilla JS
   ============================================================ */

/**
 * Open a right-side slide panel.
 * @param {string} panelId - ID of the .side-panel element
 */
function openPanel(panelId) {
  const panel = document.getElementById(panelId);
  const overlay = document.getElementById(panelId + '-overlay');
  if (!panel || !overlay) return;

  overlay.classList.add('open');
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Focus trap
  const focusable = panel.querySelectorAll('input, select, textarea, button, [tabindex]');
  if (focusable.length > 0) {
    setTimeout(() => focusable[0].focus(), 100);
  }

  // Close on overlay click
  overlay.onclick = () => closePanel(panelId);

  // Close on Escape
  panel._escHandler = (e) => {
    if (e.key === 'Escape') closePanel(panelId);
  };
  document.addEventListener('keydown', panel._escHandler);
}

/**
 * Close a right-side slide panel.
 * @param {string} panelId - ID of the .side-panel element
 */
function closePanel(panelId) {
  const panel = document.getElementById(panelId);
  const overlay = document.getElementById(panelId + '-overlay');
  if (!panel || !overlay) return;

  overlay.classList.remove('open');
  panel.classList.remove('open');
  document.body.style.overflow = '';

  if (panel._escHandler) {
    document.removeEventListener('keydown', panel._escHandler);
  }
}
