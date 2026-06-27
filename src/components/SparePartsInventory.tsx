import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wrench, Plus, Search, Trash2, Pencil, Minus } from 'lucide-react';
import { toast } from 'sonner';

type Part = {
  id: string;
  category: string;
  brand: string | null;
  part_type: string;
  price: number;
  stock: number;
};

const empty: Omit<Part, 'id'> = { category: '', brand: '', part_type: '', price: 0, stock: 0 };

export function SparePartsInventory() {
  const [items, setItems] = useState<Part[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Part, 'id'>>(empty);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const load = async () => {
    const [{ data: parts }, { data: cats }] = await Promise.all([
      supabase.from('spare_parts' as any).select('*').order('category'),
      supabase.from('spare_part_categories' as any).select('name').order('name'),
    ]);
    setItems(((parts as any) || []) as Part[]);
    setCategories(((cats as any) || []).map((c: any) => c.name));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      (i.category || '').toLowerCase().includes(q) ||
      (i.brand || '').toLowerCase().includes(q) ||
      (i.part_type || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const openNew = () => {
    setEditingId(null);
    setForm(empty);
    setCreatingCategory(false);
    setNewCategory('');
    setOpen(true);
  };

  const openEdit = (p: Part) => {
    setEditingId(p.id);
    setForm({ category: p.category, brand: p.brand || '', part_type: p.part_type, price: p.price, stock: p.stock });
    setCreatingCategory(false);
    setNewCategory('');
    setOpen(true);
  };

  const ensureCategory = async (): Promise<string | null> => {
    if (creatingCategory) {
      const name = newCategory.trim();
      if (!name) { toast.error('Ingresá el nombre de la categoría'); return null; }
      if (!categories.includes(name)) {
        const { error } = await supabase.from('spare_part_categories' as any).insert({ name });
        if (error && !String(error.message).includes('duplicate')) {
          toast.error('No se pudo crear la categoría'); return null;
        }
        setCategories(c => Array.from(new Set([...c, name])).sort());
      }
      return name;
    }
    if (!form.category) { toast.error('Elegí una categoría'); return null; }
    return form.category;
  };

  const save = async () => {
    const category = await ensureCategory();
    if (!category) return;
    if (!form.part_type.trim()) { toast.error('Indicá el tipo / descripción del repuesto'); return; }
    const payload = {
      category,
      brand: form.brand?.trim() || null,
      part_type: form.part_type.trim(),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
    };
    if (editingId) {
      const { error } = await supabase.from('spare_parts' as any).update(payload).eq('id', editingId);
      if (error) { toast.error('Error al actualizar'); return; }
      toast.success('Repuesto actualizado');
    } else {
      const { error } = await supabase.from('spare_parts' as any).insert(payload);
      if (error) { toast.error('Error al crear'); return; }
      toast.success('Repuesto agregado');
    }
    setOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este repuesto?')) return;
    const { error } = await supabase.from('spare_parts' as any).delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Repuesto eliminado');
    await load();
  };

  const adjustStock = async (p: Part, delta: number) => {
    const next = Math.max(0, (p.stock || 0) + delta);
    if (next === p.stock) return;
    setItems(prev => prev.map(i => i.id === p.id ? { ...i, stock: next } : i));
    const { error } = await supabase.from('spare_parts' as any).update({ stock: next }).eq('id', p.id);
    if (error) {
      toast.error('Error al actualizar stock');
      setItems(prev => prev.map(i => i.id === p.id ? { ...i, stock: p.stock } : i));
    }
  };

  const stockBadge = (n: number) => {
    if (n <= 0) return <Badge variant="destructive">Sin Stock</Badge>;
    if (n <= 3) return <Badge className="bg-yellow-500 text-black hover:bg-yellow-500">Stock Bajo ({n})</Badge>;
    return <Badge variant="secondary">{n}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border shadow-sm">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por categoría, marca o tipo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <span className="text-sm text-muted-foreground">{filtered.length} repuesto{filtered.length !== 1 ? 's' : ''}</span>
          <Button onClick={openNew} className="gap-2 ml-auto bg-pink-600 hover:bg-pink-700 text-white">
            <Wrench className="h-4 w-4" /> Agregar Repuesto
          </Button>
        </div>
        <div className="p-2 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Tipo / Descripción</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin repuestos registrados</TableCell></TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell><Badge variant="outline" className="border-pink-500/40 text-pink-600 dark:text-pink-400">{p.category}</Badge></TableCell>
                  <TableCell>{p.brand || '—'}</TableCell>
                  <TableCell className="font-medium">{p.part_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => adjustStock(p, -1)} disabled={(p.stock || 0) <= 0}><Minus className="h-3.5 w-3.5" /></Button>
                      <div className="min-w-[2.5rem] text-center">{stockBadge(p.stock || 0)}</div>
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => adjustStock(p, 1)}><Plus className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">${(p.price || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editingId ? 'Editar Repuesto' : 'Agregar Repuesto'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Categoría</Label>
              {creatingCategory ? (
                <div className="flex gap-2">
                  <Input autoFocus value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ej: Cámaras traseras" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setCreatingCategory(false); setNewCategory(''); }}>Cancelar</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Elegí una categoría" /></SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-muted-foreground">Sin categorías. Creá la primera →</div>
                      ) : categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setCreatingCategory(true)}>+ Nueva</Button>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Marca</Label>
              <Input value={form.brand || ''} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Ej: Samsung" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo / Descripción</Label>
              <Input value={form.part_type} onChange={e => setForm(f => ({ ...f, part_type: e.target.value }))} placeholder="Ej: Pin de carga Tipo C" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Precio</Label>
              <Input type="number" inputMode="decimal" value={form.price}
                onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cantidad en stock</Label>
              <Input type="number" inputMode="numeric" value={form.stock}
                onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} className="bg-pink-600 hover:bg-pink-700 text-white">{editingId ? 'Guardar' : 'Agregar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}