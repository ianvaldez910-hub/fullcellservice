import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  Search,
  Wrench,
  Package,
  CheckCircle2,
  PartyPopper,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

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
  { key: 'received', label: 'Recibido / Registrado',  icon: CheckCircle2 },
  { key: 'waiting',  label: 'Esperando Repuesto',     icon: Package },
  { key: 'repair',   label: 'En Reparación',          icon: Wrench },
  { key: 'ready',    label: '¡Listo para Entregar!',  icon: PartyPopper },
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

  const [orderInput, setOrderInput] = useState(initialQuery);
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TrackResult[] | null>(null);

  const handleSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setError('Ingresá tu número de orden o tu celular.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    const { data, error } = await (supabase as any).rpc('track_repair', { _query: trimmed });
    setLoading(false);
    if (error) {
      setError('No pudimos consultar el estado. Probá de nuevo.');
      return;
    }
    if (!data || data.length === 0) {
      setError('No encontramos ninguna reparación con esos datos.');
      return;
    }
    setResults(data as TrackResult[]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = orderInput.trim() || phoneInput.trim();
    handleSearch(q);
  };

  const resetSearch = () => {
    setResults(null);
    setError(null);
    setOrderInput('');
    setPhoneInput('');
  };

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Soft pink glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {!results ? (
          <SearchScreen
            orderInput={orderInput}
            setOrderInput={setOrderInput}
            phoneInput={phoneInput}
            setPhoneInput={setPhoneInput}
            onSubmit={onSubmit}
            loading={loading}
            error={error}
          />
        ) : (
          <ResultsScreen results={results} onBack={resetSearch} />
        )}

        <p className="text-center text-xs text-slate-600 mt-8">
          Powered by <span className="text-pink-500/80 font-medium">FullCell Service</span>
        </p>
      </div>
    </div>
  );
}

function SearchScreen({
  orderInput,
  setOrderInput,
  phoneInput,
  setPhoneInput,
  onSubmit,
  loading,
  error,
}: {
  orderInput: string;
  setOrderInput: (v: string) => void;
  phoneInput: string;
  setPhoneInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-pink-500/5 p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="bg-pink-500/10 p-3 rounded-2xl text-pink-500 border border-pink-500/20">
          <Wrench className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white tracking-tight">
          Consulta de Reparación
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xs">
          Ingresá tu número de orden o tu celular para ver el estado de tu equipo en tiempo real.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Número de Orden
          </label>
          <input
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            placeholder="Ej: 123"
            inputMode="numeric"
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 rounded-xl px-4 py-3 transition"
          />
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs uppercase tracking-wider text-slate-600">O también</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Número de Celular
          </label>
          <input
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Ej: 1155667788"
            inputMode="tel"
            className="w-full bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 rounded-xl px-4 py-3 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition duration-150 shadow-lg shadow-pink-500/20"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
          {loading ? 'Buscando...' : 'Consultar Estado'}
        </button>

        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}

function ResultsScreen({
  results,
  onBack,
}: {
  results: TrackResult[];
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-pink-500 transition px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-pink-500/30"
      >
        <ArrowLeft className="h-4 w-4" />
        Realizar otra consulta
      </button>

      {results.map((r) => (
        <RepairCard key={r.order_number} data={r} />
      ))}
    </div>
  );
}

function RepairCard({ data }: { data: TrackResult }) {
  const idx = activeIndex(data.status);
  const waPhone = (data.whatsapp_number || '').replace(/\D/g, '');
  const waMsg = encodeURIComponent(
    `¡Hola! Consulto por mi reparación #${data.order_number} (${data.brand} ${data.model}).`
  );
  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-pink-500/5 overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-xs font-bold text-pink-500 bg-pink-500/10 px-2.5 py-1 rounded-full border border-pink-500/20">
            Orden #{data.order_number}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">
            {data.business_name}
          </span>
        </div>

        <h2 className="text-xl font-bold text-white leading-tight">
          {data.brand} {data.model}
        </h2>
        {data.problem && (
          <p className="text-sm text-slate-400 mt-1.5">{data.problem}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Ingreso:</span>
          <span className="text-slate-300 font-medium">{data.date_in}</span>
          {data.date_estimated && (
            <>
              <span className="text-slate-700">•</span>
              <span className="text-slate-500">Entrega est.:</span>
              <span className="text-slate-300 font-medium">{data.date_estimated}</span>
            </>
          )}
        </div>

        {data.budget > 0 && (
          <div className="mt-3 inline-flex items-center gap-2">
            <span className="text-xs text-slate-500">Presupuesto:</span>
            <span className="text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 py-1 px-2.5 rounded-lg text-sm font-mono font-semibold">
              ${Number(data.budget).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Estado del proceso
        </p>
        <Timeline activeIdx={idx} />
      </div>

      {waUrl && (
        <div className="p-6 pt-0">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition duration-150 shadow-lg shadow-emerald-500/10">
              <MessageCircle className="h-5 w-5" />
              Consultar al técnico
            </button>
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
        const isLast = i === STEPS.length - 1;
        const lit = done || current;

        return (
          <li key={s.key} className="flex gap-4 pb-5 last:pb-0 relative">
            {!isLast && (
              <span
                className={`absolute left-[18px] top-10 bottom-0 w-0.5 ${
                  done ? 'bg-pink-500' : 'bg-slate-800'
                }`}
                aria-hidden
              />
            )}
            <div
              className={`relative z-10 h-9 w-9 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                done
                  ? 'bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/30'
                  : current
                  ? 'bg-pink-500/10 border-pink-500 text-pink-500 ring-4 ring-pink-500/10 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : current && isLast ? (
                <span className="text-base">🎉</span>
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 pt-1.5">
              <p
                className={`text-sm font-medium ${
                  lit ? 'text-white' : 'text-slate-500'
                }`}
              >
                {s.label}
              </p>
              {current && (
                <p className="text-xs text-pink-500 mt-0.5 font-medium">
                  Etapa actual
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}