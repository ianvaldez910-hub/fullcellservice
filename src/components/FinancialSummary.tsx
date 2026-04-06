import { useState, useMemo } from 'react';
import { Equipment } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';

type TimeFilter = 'today' | 'week' | 'month';

interface FinancialSummaryProps {
  items: Equipment[];
}

function isInRange(dateStr: string, filter: TimeFilter): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return d >= startOfDay;
    case 'week': {
      const day = startOfDay.getDay();
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - (day === 0 ? 6 : day - 1));
      return d >= startOfWeek;
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= startOfMonth;
    }
  }
}

export function FinancialSummary({ items }: FinancialSummaryProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const stats = useMemo(() => {
    const filtered = items.filter(i => isInRange(i.dateIn, timeFilter));

    const ingresosPorEntregar = filtered
      .filter(i => i.status === 'Listo')
      .reduce((sum, i) => sum + Math.max(0, i.budget - i.deposit), 0);

    const cajaRealizada = filtered
      .filter(i => i.status === 'Entregado')
      .reduce((sum, i) => sum + i.budget, 0);

    const inversionEnProceso = filtered
      .filter(i => i.status === 'En Reparación' || i.status === 'Pendiente')
      .reduce((sum, i) => sum + i.deposit, 0);

    return { ingresosPorEntregar, cajaRealizada, inversionEnProceso };
  }, [items, timeFilter]);

  const filters: { key: TimeFilter; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
  ];

  const cards = [
    {
      label: 'Ingresos por Entregar',
      value: stats.ingresosPorEntregar,
      icon: Clock,
      description: 'Saldos pendientes de equipos listos',
      colorClass: 'text-status-pending',
    },
    {
      label: 'Caja Realizada',
      value: stats.cajaRealizada,
      icon: CheckCircle,
      description: 'Total cobrado de equipos entregados',
      colorClass: 'text-status-ready',
    },
    {
      label: 'Inversión en Proceso',
      value: stats.inversionEnProceso,
      icon: TrendingUp,
      description: 'Señas de equipos pendientes/en reparación',
      colorClass: 'text-status-repair',
    },
  ];

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Resumen de Caja</h2>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {filters.map(f => (
            <Button
              key={f.key}
              variant={timeFilter === f.key ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setTimeFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <card.icon className={`h-4 w-4 ${card.colorClass}`} />
            </div>
            <p className={`text-2xl font-bold font-mono ${card.colorClass}`}>
              ${card.value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
