import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface PatternDrawerProps {
  value: number[];
  onChange: (pattern: number[]) => void;
}

export function PatternDrawer({ value, onChange }: PatternDrawerProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [current, setCurrent] = useState<number[]>(value);

  const handleDotClick = useCallback((dot: number) => {
    setCurrent(prev => {
      if (prev.includes(dot)) return prev;
      const next = [...prev, dot];
      return next;
    });
  }, []);

  const handleClear = () => {
    setCurrent([]);
    onChange([]);
  };

  const handleSave = () => {
    onChange(current);
    setIsDrawing(false);
  };

  if (!isDrawing && value.length === 0) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawing(true)} className="text-xs">
        🔐 Dibujar Patrón
      </Button>
    );
  }

  if (!isDrawing && value.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-grid grid-cols-3 gap-1.5 p-2 bg-muted rounded-lg">
          {[1,2,3,4,5,6,7,8,9].map(dot => {
            const idx = value.indexOf(dot);
            const active = idx !== -1;
            return (
              <div
                key={dot}
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                  active ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                }`}
              >
                {active ? idx + 1 : ''}
              </div>
            );
          })}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setCurrent(value); setIsDrawing(true); }} className="text-xs">
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Tocá los puntos en orden para dibujar el patrón:</p>
      <div className="inline-grid grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
        {[1,2,3,4,5,6,7,8,9].map(dot => {
          const idx = current.indexOf(dot);
          const active = idx !== -1;
          return (
            <button
              key={dot}
              type="button"
              onClick={() => handleDotClick(dot)}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                active
                  ? 'bg-primary border-primary text-primary-foreground scale-110'
                  : 'border-muted-foreground/40 hover:border-primary/60 hover:bg-primary/10'
              }`}
            >
              {active ? idx + 1 : '·'}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleClear} className="text-xs">Limpiar</Button>
        <Button type="button" size="sm" onClick={handleSave} className="text-xs" disabled={current.length < 2}>
          Guardar Patrón
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => { setIsDrawing(false); setCurrent(value); }} className="text-xs">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
