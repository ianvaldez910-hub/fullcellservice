// Utilities to apply a dynamic primary color (HEX) to the CSS design tokens.

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslString(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

export const COLOR_STORAGE_KEY = 'app-primary-color';

export function applyPrimaryColor(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  const root = document.documentElement;
  root.style.setProperty('--primary', `${h} ${s}% ${l}%`);
  root.style.setProperty('--ring', `${h} ${s}% ${l}%`);
  root.style.setProperty('--sidebar-primary', `${h} ${s}% ${l}%`);
  // Pick readable foreground (white for darker primaries, near-black for very light)
  const fg = l > 70 ? '220 25% 10%' : '0 0% 100%';
  root.style.setProperty('--primary-foreground', fg);
  root.style.setProperty('--sidebar-primary-foreground', fg);
  try { localStorage.setItem(COLOR_STORAGE_KEY, hex); } catch {}
}

export function loadSavedPrimaryColor() {
  try {
    const hex = localStorage.getItem(COLOR_STORAGE_KEY);
    if (hex) applyPrimaryColor(hex);
  } catch {}
}

export const PRESET_PALETTES: { name: string; hex: string }[] = [
  { name: 'Azul Zafiro', hex: '#1E40AF' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Oro Rosa', hex: '#E11D88' },
  { name: 'Rojo Carmesí', hex: '#DC2626' },
  { name: 'Gris Titanio', hex: '#475569' },
  { name: 'Violeta Amatista', hex: '#7C3AED' },
  { name: 'Naranja Sunset', hex: '#F59E0B' },
];