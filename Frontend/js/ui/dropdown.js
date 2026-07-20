/* ============================================================
   DROPDOWN — ARIA-compliant dropdown menu
   ============================================================ */

/**
 * Initialize a dropdown trigger.
 * @param {string} triggerId - ID of the trigger element
 * @param {string} menuId - ID of the dropdown menu element
 */
function initDropdown(triggerId, menuId) {
  const trigger = document.getElementById(triggerId);
  const menu = document.getElementById(menuId);
  if (!trigger || !menu) return;

  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('role', 'menu');
  menu.style.display = 'none';

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.style.display !== 'none';
    if (isOpen) {
      closeDropdown(trigger, menu);
    } else {
      openDropdownMenu(trigger, menu);
    }
  });

  // Close on outside click
  document.addEventListener('click', () => {
    closeDropdown(trigger, menu);
  });

  // Keyboard nav
  menu.addEventListener('keydown', (e) => {
    const items = menu.querySelectorAll('[role="menuitem"]');
    const idx = Array.from(items).indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx < items.length - 1) items[idx + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx > 0) items[idx - 1].focus();
    } else if (e.key === 'Escape') {
      closeDropdown(trigger, menu);
      trigger.focus();
    }
  });
}

function openDropdownMenu(trigger, menu) {
  menu.style.display = 'block';
  trigger.setAttribute('aria-expanded', 'true');
  const firstItem = menu.querySelector('[role="menuitem"]');
  if (firstItem) firstItem.focus();
}

function closeDropdown(trigger, menu) {
  menu.style.display = 'none';
  trigger.setAttribute('aria-expanded', 'false');
}
