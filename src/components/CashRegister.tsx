import { useState, useMemo } from 'react';
import { useCashDB, CashEntryItem } from '@/hooks/useCashDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Plus, Trash2 } from 'lucide-react';

export function CashRegister() {
  const { entries, addEntry, deleteEntry } = useCashDB();
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState({ orderId: '', clientName: '', amount: '', concept: '' });

  const filtered = useMemo(() =>
    entries.filter(e => e.date === filterDate).sort((a, b) => b.id - a.id),
    [entries, filterDate]
  );

  const dayTotal = useMemo(() =>
    filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEntry({
      date: filterDate,
      orderId: Number(form.orderId) || 0,
      clientName: form.clientName,
      amount: Number(form.amount) || 0,
      concept: form.concept,
    });
    setForm({ orderId: '', clientName: '', amount: '', concept: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-status-ready" />
          <h2 className="font-bold text-lg">Caja del Día</h2>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-40 h-9 text-sm" />
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
            <Plus className="h-3 w-3" /> Ingreso
          </Button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 border-b bg-muted/30 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Orden #</Label>
            <Input placeholder="Ej: 5" value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} className="h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cliente</Label>
            <Input placeholder="Nombre" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="h-9" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Monto ($)</Label>
            <Input type="number" min={0} placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="h-9" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Concepto</Label>
            <Input placeholder="Reparación, seña..." value={form.concept} onChange={e => setForm(f => ({ ...f, concept: e.target.value }))} className="h-9" />
          </div>
          <Button type="submit" size="sm" className="h-9">Registrar</Button>
        </form>
      )}

      <div className="p-4">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">No hay movimientos para esta fecha</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 text-sm">
                <div className="flex items-center gap-3">
                  {entry.orderId > 0 && <span className="font-mono text-xs text-muted-foreground">#{entry.orderId}</span>}
                  <span className="font-medium">{entry.clientName}</span>
                  {entry.concept && <span className="text-muted-foreground">· {entry.concept}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-status-ready">${entry.amount.toLocaleString()}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEntry(entry.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 pt-3 border-t flex justify-between items-center">
          <span className="font-semibold text-sm">Total del día:</span>
          <span className="font-mono font-bold text-lg text-status-ready">${dayTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
