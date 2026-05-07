// theme.js — Design tokens for LegalRAG
// American Psycho palette: ivory, charcoal, blood red
// Light mode inverts the surface hierarchy, keeps the blood accent

export const FONT = {
  serif:  "'Playfair Display', 'Georgia', serif",
  mono:   "'DM Mono', 'Courier New', monospace",
  sans:   "'DM Sans', 'Helvetica Neue', sans-serif",
};

// Raw palette (mode-independent)
const RAW = {
  ivory:      "#F5F0E8",
  ivoryDark:  "#EDE7D9",
  cream:      "#FAF7F2",
  charcoal:   "#1A1A18",
  carbon:     "#111110",
  slate:      "#2C2C28",
  ash:        "#4A4A44",
  fog:        "#8A8A84",
  blood:      "#8B0000",
  bloodBright:"#B50000",
  gold:       "#C9A84C",
  white:      "#FEFCF8",
  lightSurface: "#F0EBE1",
  lightBorder:  "#D4C8B8",
  lightFog:     "#9A9080",
};

// Semantic token sets per mode
const DARK = {
  bg:         RAW.carbon,
  surface:    RAW.charcoal,
  panel:      RAW.slate,
  border:     RAW.ash,
  borderFaint:"#3A3A34",
  text:       RAW.ivory,
  textSub:    RAW.ivoryDark,
  textMuted:  RAW.fog,
  textDim:    RAW.ash,
  accent:     RAW.blood,
  accentHover:RAW.bloodBright,
  accentBg:   "#8B000018",
  gold:       RAW.gold,
  goldBg:     "#C9A84C14",
};

const LIGHT = {
  bg:         RAW.cream,
  surface:    RAW.white,
  panel:      RAW.lightSurface,
  border:     RAW.lightBorder,
  borderFaint:"#E0D8CC",
  text:       RAW.charcoal,
  textSub:    RAW.slate,
  textMuted:  RAW.ash,
  textDim:    RAW.lightFog,
  accent:     RAW.blood,
  accentHover:RAW.bloodBright,
  accentBg:   "#8B000010",
  gold:       "#A07828",
  goldBg:     "#C9A84C10",
};

export function getTheme(dark) {
  return dark ? DARK : LIGHT;
}

export function severityColor(s, T) {
  if (s === "HIGH")   return T.accent;
  if (s === "MEDIUM") return T.gold;
  return "#4A7C4A";
}
export function severityBg(s) {
  if (s === "HIGH")   return "#8B000010";
  if (s === "MEDIUM") return "#C9A84C10";
  return "#4A7C4A10";
}
export function severityLabel(s) {
  let color = "#22c55e"; 
  let label = "LOW";

  if (s === "HIGH") {
    color = "#ef4444"; 
    label = "HIGH";
  } else if (s === "MEDIUM") {
    color = "#eab308"; 
    label = "MEDIUM";
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="6" fill={color} />
      </svg>
      {label}
    </span>
  );
}

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@300;400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { border-radius: 2px; }
::selection { background: #8B0000; color: #F5F0E8; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); max-height: 0; }
  to   { opacity: 1; transform: translateY(0); max-height: 600px; }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes ripple {
  from { transform: scale(0.92); opacity: 0.7; }
  to   { transform: scale(1);    opacity: 1; }
}
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.fade-up   { animation: fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both; }
.fade-in   { animation: fadeIn 0.25s ease both; }
.slide-in  { animation: slideInLeft 0.3s cubic-bezier(0.22,1,0.36,1) both; }

.btn-hover {
  transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
}
.btn-hover:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139,0,0,0.25);
}
.btn-hover:active:not(:disabled) {
  transform: translateY(0);
}

.card-hover {
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
}
.card-hover:hover {
  transform: translateX(2px);
}
`;
