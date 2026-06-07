// Utilities to apply a full dynamic theme (HEX) to the CSS design tokens.
// Generates background, card, sidebar, muted, border, accent tones from a
// single base color, with automatic text-contrast for light and dark modes.

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

export const COLOR_STORAGE_KEY = 'app-primary-color';
export const THEME_MODE_KEY = 'theme';

const TOKEN_KEYS = [
  '--primary','--ring','--primary-foreground',
  '--background','--foreground',
  '--card','--card-foreground',
  '--popover','--popover-foreground',
  '--muted','--muted-foreground',
  '--accent','--accent-foreground',
  '--secondary','--secondary-foreground',
  '--border','--input',
  '--sidebar-background','--sidebar-foreground',
  '--sidebar-primary','--sidebar-primary-foreground',
  '--sidebar-accent','--sidebar-accent-foreground',
  '--sidebar-border','--sidebar-ring',
];

export function applyTheme(hex: string, dark: boolean) {
  const { h, s, l } = hexToHsl(hex);
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);

  // Accent color (vibrant original)
  set('--primary', `${h} ${s}% ${l}%`);
  set('--ring', `${h} ${s}% ${l}%`);
  set('--sidebar-primary', `${h} ${s}% ${l}%`);
  const accentFg = l > 70 ? '220 25% 10%' : '0 0% 100%';
  set('--primary-foreground', accentFg);
  set('--sidebar-primary-foreground', accentFg);

  if (dark) {
    const sat = Math.min(s, 30);
    set('--background', `${h} ${sat}% 8%`);
    set('--card', `${h} ${sat}% 12%`);
    set('--popover', `${h} ${sat}% 12%`);
    set('--muted', `${h} ${sat}% 16%`);
    set('--accent', `${h} ${sat}% 18%`);
    set('--secondary', `${h} ${sat}% 18%`);
    set('--border', `${h} ${sat}% 22%`);
    set('--input', `${h} ${sat}% 22%`);
    set('--foreground', `${h} 15% 95%`);
    set('--card-foreground', `${h} 15% 95%`);
    set('--popover-foreground', `${h} 15% 95%`);
    set('--muted-foreground', `${h} 10% 65%`);
    set('--accent-foreground', `${h} 15% 95%`);
    set('--secondary-foreground', `${h} 15% 95%`);
    set('--sidebar-background', `${h} ${sat}% 10%`);
    set('--sidebar-foreground', `${h} 15% 90%`);
    set('--sidebar-accent', `${h} ${sat}% 18%`);
    set('--sidebar-accent-foreground', `${h} 15% 95%`);
    set('--sidebar-border', `${h} ${sat}% 22%`);
    set('--sidebar-ring', `${h} ${s}% ${l}%`);
  } else {
    const sat = Math.min(s, 45);
    set('--background', `${h} ${sat}% 97%`);
    set('--card', `0 0% 100%`);
    set('--popover', `0 0% 100%`);
    set('--muted', `${h} ${sat}% 94%`);
    set('--accent', `${h} ${sat}% 92%`);
    set('--secondary', `${h} ${sat}% 92%`);
    set('--border', `${h} ${sat}% 88%`);
    set('--input', `${h} ${sat}% 88%`);
    set('--foreground', `${h} 25% 12%`);
    set('--card-foreground', `${h} 25% 12%`);
    set('--popover-foreground', `${h} 25% 12%`);
    set('--muted-foreground', `${h} 10% 40%`);
    set('--accent-foreground', `${h} 25% 20%`);
    set('--secondary-foreground', `${h} 25% 20%`);
    set('--sidebar-background', `${h} ${sat}% 98%`);
    set('--sidebar-foreground', `${h} 25% 26%`);
    set('--sidebar-accent', `${h} ${sat}% 92%`);
    set('--sidebar-accent-foreground', `${h} 25% 15%`);
    set('--sidebar-border', `${h} ${sat}% 88%`);
    set('--sidebar-ring', `${h} ${s}% ${l}%`);
  }
}

// Backwards-compatible export name used by AppearanceSettings.
export function applyPrimaryColor(hex: string) {
  const dark = document.documentElement.classList.contains('dark');
  applyTheme(hex, dark);
  try { localStorage.setItem(COLOR_STORAGE_KEY, hex); } catch {}
}

export function saveTheme(hex: string, dark: boolean) {
  try {
    localStorage.setItem(COLOR_STORAGE_KEY, hex);
    localStorage.setItem(THEME_MODE_KEY, dark ? 'dark' : 'light');
  } catch {}
  document.documentElement.classList.toggle('dark', dark);
  applyTheme(hex, dark);
}

export function loadSavedPrimaryColor() {
  try {
    const hex = localStorage.getItem(COLOR_STORAGE_KEY);
    const stored = localStorage.getItem(THEME_MODE_KEY);
    const dark = stored
      ? stored === 'dark'
      : (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', !!dark);
    if (hex) applyTheme(hex, !!dark);
  } catch {}
}

export function resetTheme() {
  try {
    localStorage.removeItem(COLOR_STORAGE_KEY);
    localStorage.removeItem(THEME_MODE_KEY);
  } catch {}
  const root = document.documentElement;
  TOKEN_KEYS.forEach(k => root.style.removeProperty(k));
  // Restore mode based on system preference
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', !!prefersDark);
}

export const PRESET_PALETTES: { name: string; hex: string }[] = [
  { name: 'Rosa Sakura', hex: '#FF69B4' },
  { name: 'Rojo Carmesí', hex: '#DC2626' },
  { name: 'Azul Zafiro', hex: '#2563EB' },
  { name: 'Verde Esmeralda', hex: '#059669' },
  { name: 'Violeta Amatista', hex: '#7C3AED' },
  { name: 'Naranja Sunset', hex: '#F59E0B' },
  { name: 'Turquesa', hex: '#0EA5A4' },
  { name: 'Negro Nocturno', hex: '#0F172A' },
];