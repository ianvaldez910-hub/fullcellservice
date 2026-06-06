import { useEffect, useState } from 'react';
import { Palette, Sun, Moon, Check, Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { applyPrimaryColor, COLOR_STORAGE_KEY, PRESET_PALETTES } from '@/lib/color';
import { toast } from 'sonner';

function isDarkMode() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function AppearanceSettings() {
  const [dark, setDark] = useState<boolean>(false);
  const [color, setColor] = useState<string>('#1E40AF');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    setDark(stored ? stored === 'dark' : !!prefersDark);
    const savedColor = localStorage.getItem(COLOR_STORAGE_KEY);
    if (savedColor) setColor(savedColor);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const pick = (hex: string) => {
    setColor(hex);
    applyPrimaryColor(hex);
    toast.success('Color principal actualizado');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Palette className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Apariencia</h2>
          <p className="text-xs text-muted-foreground">Personalizá el tema y el color principal</p>
        </div>
      </div>

      {/* Theme mode */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modo Base</Label>
        <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setDark(false)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!dark ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Sun className="h-4 w-4" /> Tema Claro
          </button>
          <button
            type="button"
            onClick={() => setDark(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${dark ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Moon className="h-4 w-4" /> Tema Oscuro
          </button>
        </div>
      </div>

      {/* Preset palettes */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paletas Elegantes</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {PRESET_PALETTES.map(p => {
            const selected = color.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => pick(p.hex)}
                className="flex flex-col items-center gap-2 group"
              >
                <span
                  className={`relative h-14 w-14 rounded-full shadow-md ring-offset-2 ring-offset-background transition-all group-hover:scale-105 ${selected ? 'ring-2 ring-foreground' : 'ring-1 ring-border'}`}
                  style={{ background: `radial-gradient(circle at 30% 30%, ${p.hex}ee, ${p.hex})` }}
                >
                  {selected && (
                    <Check className="absolute inset-0 m-auto h-6 w-6 text-white drop-shadow" strokeWidth={3} />
                  )}
                </span>
                <span className="text-[11px] font-medium text-center leading-tight">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom color picker */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color Personalizado</Label>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="relative cursor-pointer">
            <input
              type="color"
              value={color}
              onChange={e => pick(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="inline-flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 shadow-sm hover:shadow-md transition-all">
              <span className="h-8 w-8 rounded-lg border" style={{ background: color }} />
              <span className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">HEX actual</span>
                <span className="font-mono text-sm font-bold">{color.toUpperCase()}</span>
              </span>
              <Pipette className="h-4 w-4 text-muted-foreground" />
            </span>
          </label>
          <Button variant="outline" size="sm" onClick={() => pick('#2563EB')}>Restablecer</Button>
        </div>
        <p className="text-[11px] text-muted-foreground">El color se guarda en este dispositivo y se aplica de inmediato a botones, enlaces, bordes activos e iconos.</p>
      </div>
    </div>
  );
}