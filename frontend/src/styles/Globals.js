/**
 * styles/globals.js
 * ─────────────────────────────────────────────
 * CSS variables + keyframes injected once via <style> in TrajetPage.
 * Shared across all components through CSS custom properties.
 */
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #080c14;
    --surface:     rgba(255,255,255,0.03);
    --border:      rgba(255,255,255,0.07);
    --border-hi:   rgba(255,255,255,0.12);
    --blue:        #2563eb;
    --blue-lo:     rgba(37,99,235,0.12);
    --blue-glow:   rgba(37,99,235,0.35);
    --orange:      #f97316;
    --orange-lo:   rgba(249,115,22,0.12);
    --orange-glow: rgba(249,115,22,0.3);
    --red:         #ef4444;
    --red-lo:      rgba(239,68,68,0.12);
    --green:       #10b981;
    --text:        #f8fafc;
    --muted:       rgba(248,250,252,0.38);
    --faint:       rgba(248,250,252,0.14);
    --font:        'Outfit', sans-serif;
    --mono:        'JetBrains Mono', monospace;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 2px; }

  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0.45) sepia(1) saturate(3) hue-rotate(190deg);
    cursor: pointer;
    opacity: 0.6;
    transition: opacity .2s;
  }
  input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(52px) scale(0.93); }
    to   { opacity: 1; transform: translateX(0) scale(1);       }
  }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes orb1 {
    0%,100% { transform: translate(0,0) scale(1);            }
    33%      { transform: translate(28px,-18px) scale(1.07);  }
    66%      { transform: translate(-18px,10px) scale(0.95);  }
  }
  @keyframes orb2 {
    0%,100% { transform: translate(0,0) scale(1);             }
    40%      { transform: translate(-22px,14px) scale(1.05);  }
    70%      { transform: translate(16px,-11px) scale(0.96);  }
  }
  @keyframes inputShake {
    0%,100% { transform: translateX(0);    }
    20%      { transform: translateX(-5px); }
    40%      { transform: translateX(5px);  }
    60%      { transform: translateX(-3px); }
    80%      { transform: translateX(3px);  }
  }
  @keyframes gradShift {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
`;