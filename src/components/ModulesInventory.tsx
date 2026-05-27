import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, Plus, Search, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

type Module = {
  id: string;
  brand: string;
  model: string;
  quality: string;
  color: string;
  stock: number;
  cost_price: number;
  sale_price: number;
};

const empty: Omit<Module, 'id'> = {
  brand: '', model: '', quality: '', color: '', stock: 0, cost_price: 0, sale_price: 0,
};

export function ModulesInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<Module[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Module, 'id'>>(empty);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('modules_inventory')
      .select('id,brand,model,quality,color,stock,cost_price,sale_price')
      .order('brand', { ascending: true });
    if (error) { toast.error('Error al cargar inventario'); return; }
    setItems((data || []) as Module[]);
  };

  useEffect(() => { load(); }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      (i.brand || '').toLowerCase().includes(q) ||
      (i.model || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const openNew = () => { setEditingId(null); setForm(empty); setOpen(true); };
  const openEdit = (m: Module) => {
    setEditingId(m.id);
    setForm({ brand: m.brand, model: m.model, quality: m.quality, color: m.color, stock: m.stock, cost_price: m.cost_price, sale_price: m.sale_price });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.brand.trim() || !form.model.trim()) { toast.error('Marca y Modelo son obligatorios'); return; }
    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      quality: form.quality.trim(),
      color: form.color.trim(),
      stock: Number(form.stock) || 0,
      cost_price: Number(form.cost_price) || 0,
      sale_price: Number(form.sale_price) || 0,
    };
    if (editingId) {
      const { error } = await supabase.from('modules_inventory').update(payload).eq('id', editingId);
      if (error) { toast.error('Error al actualizar'); return; }
      toast.success('Módulo actualizado');
    } else {
      const { error } = await supabase.from('modules_inventory').insert({ ...payload, user_id: user.id });
      if (error) { toast.error('Error al crear'); return; }
      toast.success('Módulo agregado');
    }
    setOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este módulo?')) return;
    const { error } = await supabase.from('modules_inventory').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Módulo eliminado');
    await load();
  };

  const stockBadge = (n: number) => {
    if (n <= 0) return <Badge variant="destructive">Sin Stock</Badge>;
    if (n <= 3) return <Badge className="bg-yellow-500 text-black hover:bg-yellow-500">Stock Bajo ({n})</Badge>;
    return <Badge variant="secondary">{n}</Badge>;
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Boxes className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Inventario de Módulos</h2>
          <p className="text-xs text-muted-foreground">Gestión de repuestos en stock</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Agregar Módulo</Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por marca o modelo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} módulo{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="p-2 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Calidad</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Venta</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Sin módulos registrados</TableCell></TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.brand || '—'}</TableCell>
                  <TableCell>{m.model || '—'}</TableCell>
                  <TableCell>{m.quality || '—'}</TableCell>
                  <TableCell>{m.color || '—'}</TableCell>
                  <TableCell>{stockBadge(m.stock || 0)}</TableCell>
                  <TableCell className="text-right font-mono">${(m.cost_price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${(m.sale_price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Módulo' : 'Agregar Módulo'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Marca</Label>
              <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Ej: Samsung" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modelo</Label>
              <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Ej: A54" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Calidad</Label>
              <Input value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value }))} placeholder="Original / OLED / Incell" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Negro / Azul" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Stock</Label>
              <Input
                type="number" inputMode="numeric" value={form.stock}
                onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Precio Costo</Label>
              <Input
                type="number" inputMode="decimal" value={form.cost_price}
                onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                onChange={e => setForm(f => ({ ...f, cost_price: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Precio Venta</Label>
              <Input
                type="number" inputMode="decimal" value={form.sale_price}
                onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                onChange={e => setForm(f => ({ ...f, sale_price: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editingId ? 'Guardar' : 'Agregar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}