/* ============================================================
   GAUGE — SVG radial gauge component (~90-120° sweep)
   §8.3 Signature element: hand-drawn-style radial gauge
   Like a fuel/speedometer needle.
   ============================================================ */

/**
 * Create and render a radial gauge SVG.
 * @param {HTMLElement} container - DOM element to render into
 * @param {object} options
 * @param {number} options.value - Current value (0-100 percentage)
 * @param {string} options.color - Gauge arc color (CSS variable or hex)
 * @param {string} [options.label] - Optional center label
 */
function renderGauge(container, options = {}) {
  const {
    value = 0,
    color = 'var(--primary)',
    bgColor = 'var(--line-light)',
    needleColor = 'var(--accent)'
  } = options;

  const clampedValue = Math.max(0, Math.min(100, value));

  // Gauge geometry: 120° sweep from -240° to -120° (bottom-left to bottom-right)
  const startAngle = -240;
  const endAngle = -120;
  const sweepAngle = endAngle - startAngle; // 120°
  const needleAngle = startAngle + (clampedValue / 100) * sweepAngle;

  const cx = 50, cy = 48, r = 36;

  function polarToCart(angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  }

  const arcStart = polarToCart(startAngle);
  const arcEnd = polarToCart(endAngle);
  const arcNeedle = polarToCart(needleAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  const needleSweep = (clampedValue / 100) * sweepAngle;
  const needleLargeArc = needleSweep > 180 ? 1 : 0;

  // Needle tip calculation
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleTipX = cx + (r - 4) * Math.cos(needleRad);
  const needleTipY = cy + (r - 4) * Math.sin(needleRad);

  const svg = `
    <svg viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <!-- Background arc -->
      <path d="M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}"
            fill="none" stroke="${bgColor}" stroke-width="6" stroke-linecap="round" />

      <!-- Value arc -->
      ${clampedValue > 0 ? `
      <path d="M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${needleLargeArc} 1 ${arcNeedle.x} ${arcNeedle.y}"
            fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" />
      ` : ''}

      <!-- Needle -->
      <line x1="${cx}" y1="${cy}" x2="${needleTipX}" y2="${needleTipY}"
            stroke="${needleColor}" stroke-width="2" stroke-linecap="round" />

      <!-- Center hub -->
      <circle cx="${cx}" cy="${cy}" r="3" fill="${needleColor}" />

      <!-- Tick marks -->
      ${[0, 25, 50, 75, 100].map(tick => {
        const tickAngle = startAngle + (tick / 100) * sweepAngle;
        const outerR = r + 4;
        const innerR = r + 1;
        const outerRad = (tickAngle * Math.PI) / 180;
        const innerRad = outerRad;
        return `<line x1="${cx + innerR * Math.cos(innerRad)}" y1="${cy + innerR * Math.sin(innerRad)}"
                      x2="${cx + outerR * Math.cos(outerRad)}" y2="${cy + outerR * Math.sin(outerRad)}"
                      stroke="#888" stroke-width="1" />`;
      }).join('')}
    </svg>
  `;

  container.innerHTML = svg;
}

/**
 * Animate gauge from 0 to target value.
 * @param {HTMLElement} container
 * @param {object} options - Same as renderGauge options
 * @param {number} duration - Animation duration in ms
 */
function animateGauge(container, options, duration = 800) {
  const target = options.value || 0;
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = eased * target;

    renderGauge(container, { ...options, value: currentValue });

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}
