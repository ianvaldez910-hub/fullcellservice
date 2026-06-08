import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Wrench, Package, CheckCircle2, PartyPopper, MessageCircle, Clock } from 'lucide-react';

type TrackResult = {
  order_number: number;
  brand: string;
  model: string;
  problem: string;
  budget: number;
  date_in: string;
  date_estimated: string | null;
  status: 'Pendiente' | 'En Reparación' | 'Esperando Repuesto' | 'Listo' | 'Entregado';
  business_name: string;
  whatsapp_number: string;
};

const STEPS = [
  { key: 'received', label: 'Recibido', icon: Clock, statuses: ['Pendiente'] },
  { key: 'waiting', label: 'Esperando Repuesto', icon: Package, statuses: ['Esperando Repuesto'] },
  { key: 'repair',  label: 'En Reparación',     icon: Wrench, statuses: ['En Reparación'] },
  { key: 'ready',   label: '¡Listo para Entregar!', icon: PartyPopper, statuses: ['Listo', 'Entregado'] },
] as const;

function activeIndex(status: TrackResult['status']): number {
  if (status === 'Pendiente') return 0;
  if (status === 'Esperando Repuesto') return 1;
  if (status === 'En Reparación') return 2;
  return 3; // Listo / Entregado
}

export default function Tracking() {
  const initialQuery = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('orden') || u.searchParams.get('q') || '';
  }, []);

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TrackResult[] | null>(null);

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setError('Ingresá tu número de orden o teléfono.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    const { data, error } = await (supabase as any).rpc('track_repair', { _query: trimmed });
    setLoading(false);
    if (error) { setError('No pudimos consultar el estado. Probá de nuevo.'); return; }
    if (!data || data.length === 0) { setError('No encontramos ninguna reparación con esos datos.'); return; }
    setResults(data as TrackResult[]);
  };

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold leading-tight">Seguimiento de Reparación</h1>
            <p className="text-xs text-muted-foreground">Consultá el estado de tu equipo en tiempo real</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-card rounded-2xl border shadow-sm p-5">
          <label className="text-sm font-medium mb-2 block">Número de orden o teléfono</label>
          <form
            className="flex flex-col sm:flex-row gap-2"
            onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: 123  ó  1155667788"
              className="h-12 text-base"
              inputMode="text"
              autoFocus
            />
            <Button type="submit" size="lg" className="h-12 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Consultar
            </Button>
          </form>
          {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        </div>

        {results && results.map((r) => <RepairCard key={r.order_number} data={r} />)}

        <p className="text-center text-xs text-muted-foreground py-4">
          Powered by FullCell Service
        </p>
      </main>
    </div>
  );
}

function RepairCard({ data }: { data: TrackResult }) {
  const idx = activeIndex(data.status);
  const isReady = data.status === 'Listo' || data.status === 'Entregado';
  const waPhone = (data.whatsapp_number || '').replace(/\D/g, '');
  const waMsg = encodeURIComponent(
    `¡Hola! Consulto por mi reparación #${data.order_number} (${data.brand} ${data.model}).`
  );
  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${isReady ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-transparent' : 'bg-card'}`}>
      <div className="p-5 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Orden</p>
            <p className="font-mono font-bold text-2xl">#{data.order_number}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isReady ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
            {data.status}
          </span>
        </div>
        <p className="mt-3 font-semibold">{data.brand} {data.model}</p>
        {data.problem && <p className="text-sm text-muted-foreground mt-1">{data.problem}</p>}
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Ingreso</p>
            <p className="font-medium">{data.date_in}</p>
          </div>
          {data.date_estimated && (
            <div>
              <p className="text-xs text-muted-foreground">Entrega estimada</p>
              <p className="font-medium">{data.date_estimated}</p>
            </div>
          )}
          {data.budget > 0 && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Presupuesto</p>
              <p className="font-mono font-semibold">${Number(data.budget).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <Timeline activeIdx={idx} />
        {isReady && (
          <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
            <PartyPopper className="h-6 w-6 mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">¡Tu equipo está listo para retirar!</p>
            <p className="text-xs text-muted-foreground mt-1">Acercate al local en el horario de atención.</p>
          </div>
        )}
      </div>

      {waUrl && (
        <div className="p-5 pt-0">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white h-12">
              <MessageCircle className="h-5 w-5" />
              Consultar al técnico por WhatsApp
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}

function Timeline({ activeIdx }: { activeIdx: number }) {
  return (
    <ol className="relative">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < activeIdx;
        const current = i === activeIdx;
        const pending = i > activeIdx;
        return (
          <li key={s.key} className="flex gap-4 pb-6 last:pb-0 relative">
            {i < STEPS.length - 1 && (
              <span
                className={`absolute left-5 top-10 bottom-0 w-0.5 ${done ? 'bg-primary' : 'bg-border'}`}
                aria-hidden
              />
            )}
            <div
              className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all
                ${done ? 'bg-primary border-primary text-primary-foreground' : ''}
                ${current ? 'bg-primary/15 border-primary text-primary animate-pulse' : ''}
                ${pending ? 'bg-muted border-border text-muted-foreground' : ''}`}
            >
              {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </div>
            <div className="flex-1 pt-1.5">
              <p className={`font-medium ${current ? 'text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.label}
              </p>
              {current && <p className="text-xs text-primary mt-0.5">Etapa actual</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}