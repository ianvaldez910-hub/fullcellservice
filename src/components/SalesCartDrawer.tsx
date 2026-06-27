import { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Trash2, ShoppingCart, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SaleReceiptData } from './SalesReceiptDialog';

export type SaleSource = 'module' | 'part';

export type SaleItem = {
  key: string;        // unique cart key (source + id)
  ref_id: string;     // source row id
  source: SaleSource;
  name: string;
  category: string;
  price: number;
  qty: number;
  stock: number;
};

export type CatalogItem = {
  key: string;
  ref_id: string;
  source: SaleSource;
  name: string;
  category: string;
  price: number;
  stock: number;
};

const money = (n: number) => `$${(Number(n) || 0).toLocaleString('es-AR')}`;
const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Tarjeta'];

interface Props {
  open: boolean;
  onClose: () => void;
  cart: SaleItem[];
  setCart: React.Dispatch<React.SetStateAction<SaleItem[]>>;
  catalog: CatalogItem[]; // full catalog for in-drawer search
  onSaleConfirmed: (sale: SaleReceiptData) => void;
}

export function SalesCartDrawer({ open, onClose, cart, setCart, catalog, onSaleConfirmed }: Props) {
  const { user } = useAuth();
  const [buyer, setBuyer] = useState('');
  const [payment, setPayment] = useState('Efectivo');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [pickerItem, setPickerItem] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const categories = useMemo(() => {
    const s = new Set<string>();
    catalog.forEach(c => { if (c.category) s.add(c.category); });
    return Array.from(s).sort();
  }, [catalog]);

  const subCatalog = useMemo(() => {
    if (filterCat === 'all') return catalog;
    return catalog.filter(c => c.category === filterCat);
  }, [catalog, filterCat]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const overStock = cart.some(i => i.qty > i.stock);

  const changeQty = (key: string, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.key !== key) return [i];
      const next = i.qty + delta;
      if (next <= 0) return [];
      if (next > i.stock) { toast.error(`Stock máximo: ${i.stock}`); return [i]; }
      return [{ ...i, qty: next }];
    }));
  };

  const setQty = (key: string, raw: number) => {
    setCart(prev => prev.map(i => {
      if (i.key !== key) return i;
      const q = Math.max(1, Math.floor(raw || 1));
      return { ...i, qty: q };
    }));
  };

  const remove = (key: string) => setCart(prev => prev.filter(i => i.key !== key));

  const addFromPicker = () => {
    if (!pickerItem) return;
    const found = catalog.find(c => c.key === pickerItem);
    if (!found) return;
    setCart(prev => {
      const ex = prev.find(i => i.key === found.key);
      if (ex) {
        if (ex.qty + 1 > found.stock) { toast.error('Stock insuficiente'); return prev; }
        return prev.map(i => i.key === found.key ? { ...i, qty: i.qty + 1 } : i);
      }
      if (found.stock <= 0) { toast.error('Sin stock'); return prev; }
      return [...prev, { ...found, qty: 1 }];
    });
    setPickerItem('');
  };

  const confirmSale = async () => {
    if (!user) return;
    if (cart.length === 0) { toast.error('Carrito vacío'); return; }
    if (overStock) { toast.error('Hay artículos sobre el stock disponible'); return; }

    setBusy(true);
    try {
      const itemsSold = cart.map(i => ({
        ref_id: i.ref_id, source: i.source, name: i.name, category: i.category,
        qty: i.qty, price: i.price, subtotal: i.qty * i.price,
      }));

      const buyerName = buyer.trim() || 'Consumidor Final';

      const { data: inserted, error } = await supabase
        .from('parts_sales' as any)
        .insert({
          user_id: user.id,
          buyer_name: buyerName,
          payment_method: payment,
          items_sold: itemsSold,
          total_amount: total,
        })
        .select('id,created_at')
        .single();
      if (error) throw error;

      // Decrement stock per source in parallel
      await Promise.all(cart.map(async i => {
        const newStock = Math.max(0, i.stock - i.qty);
        const table = i.source === 'module' ? 'modules_inventory' : 'spare_parts';
        await supabase.from(table as any).update({ stock: newStock }).eq('id', i.ref_id);
      }));

      // Daily cash entry
      const today = new Date().toISOString().split('T')[0];
      const label = cart.length === 1 ? cart[0].name : `${cart.length} artículos`;
      await supabase.from('cash_entries').insert({
        user_id: user.id, date: today, order_id: 0,
        client_name: buyerName, amount: total,
        concept: `Nota de venta - ${label} (${payment})`,
      });

      const sale: SaleReceiptData = {
        id: (inserted as any)?.id || crypto.randomUUID(),
        created_at: (inserted as any)?.created_at || new Date().toISOString(),
        buyer_name: buyerName,
        payment_method: payment,
        items: itemsSold.map(i => ({ name: i.name, category: i.category, qty: i.qty, price: i.price, subtotal: i.subtotal })),
        total,
      };

      setCart([]);
      setBuyer('');
      setPayment('Efectivo');
      toast.success('Venta confirmada');
      onSaleConfirmed(sale);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Error al confirmar la venta');
    } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col bg-slate-950 text-slate-100 border-l border-pink-500/30 p-0">
        <SheetHeader className="px-5 py-4 border-b border-pink-500/30 bg-gradient-to-r from-pink-600/20 to-fuchsia-600/10">
          <SheetTitle className="flex items-center gap-2 text-pink-400">
            <ShoppingCart className="h-5 w-5" />
            Nota de Venta
            <Badge className="ml-auto bg-pink-600 hover:bg-pink-600 text-white">{cart.length}</Badge>
          </SheetTitle>
        </SheetHeader>

        {/* Quick add */}
        <div className="p-4 border-b border-slate-800 space-y-2">
          <Label className="text-[10px] uppercase tracking-wider text-pink-300/80">Agregar rápido</Label>
          <Select value={filterCat} onValueChange={(v) => { setFilterCat(v); setPickerItem(''); }}>
            <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={pickerItem} onValueChange={setPickerItem}>
              <SelectTrigger className="bg-slate-900 border-slate-700 flex-1"><SelectValue placeholder="Elegí un artículo…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {subCatalog.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Sin artículos</div>
                ) : subCatalog.map(c => (
                  <SelectItem key={c.key} value={c.key} disabled={c.stock <= 0}>
                    {c.name} {c.stock <= 0 ? '· SIN STOCK' : `· ${money(c.price)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addFromPicker} disabled={!pickerItem} className="bg-pink-600 hover:bg-pink-700 shrink-0"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Cart list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-slate-500 py-12 text-sm">Sumá artículos desde el inventario</div>
          ) : cart.map(i => {
            const over = i.qty > i.stock;
            return (
              <div key={i.key} className={`rounded-lg border p-3 ${over ? 'border-red-500/60 bg-red-950/30' : 'border-slate-800 bg-slate-900/60'}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-wide text-pink-400">{i.category || (i.source === 'module' ? 'Módulo' : 'Repuesto')}</div>
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-slate-400">{money(i.price)} c/u · stock {i.stock}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950/40" onClick={() => remove(i.key)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7 border-slate-700 bg-slate-800" onClick={() => changeQty(i.key, -1)}><Minus className="h-3.5 w-3.5" /></Button>
                    <Input
                      type="number" min={1} max={i.stock}
                      value={i.qty}
                      onChange={e => setQty(i.key, Number(e.target.value))}
                      className="h-7 w-14 text-center bg-slate-800 border-slate-700"
                    />
                    <Button size="icon" variant="outline" className="h-7 w-7 border-slate-700 bg-slate-800" onClick={() => changeQty(i.key, 1)} disabled={i.qty >= i.stock}><Plus className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="text-sm font-bold text-pink-300">{money(i.price * i.qty)}</div>
                </div>
                {over && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-red-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> Supera el stock disponible
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer / checkout */}
        <div className="border-t border-pink-500/30 p-4 space-y-3 bg-slate-900/70">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase tracking-wider text-pink-300/80">Comprador / Técnico</Label>
              <Input placeholder="Consumidor Final" value={buyer} onChange={e => setBuyer(e.target.value)} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase tracking-wider text-pink-300/80">Método de pago</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Total a cobrar</span>
            <span className="text-2xl font-extrabold text-pink-400">{money(total)}</span>
          </div>

          <Button
            onClick={confirmSale}
            disabled={busy || cart.length === 0 || overStock}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-11"
          >
            {busy ? 'Procesando…' : 'Confirmar Venta y Generar Recibo'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}