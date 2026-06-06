import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Plus, Minus, Trash2, Pencil, Receipt, Download, Image as ImageIcon, Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

type Source = 'general' | 'module';

type Product = {
  id: string;
  category: string;
  product_name: string;
  stock: number;
  cost_price: number;
  sale_price: number;
  source: Source;
  warranty_days?: number;
};

type CartItem = {
  id: string;
  product_name: string;
  sale_price: number;
  qty: number;
  stock: number;
  source: Source;
  warranty_days: number;
};

const money = (n: number) => `$${(Number(n) || 0).toLocaleString('es-AR')}`;
const emptyForm: Omit<Product, 'id' | 'source'> = { category: '', product_name: '', stock: 0, cost_price: 0, sale_price: 0, warranty_days: 0 };

const WARRANTY_PRESETS = [0, 30, 90, 180];

function NumInput({ value, onChange, ...rest }: { value: number; onChange: (n: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [str, setStr] = useState(String(value || 0));
  useEffect(() => { setStr(String(value ?? 0)); }, [value]);
  return (
    <Input
      type="number" inputMode="decimal" value={str}
      onFocus={e => { if (str === '0') { setStr(''); e.target.select(); } }}
      onChange={e => { setStr(e.target.value); onChange(Number(e.target.value) || 0); }}
      onBlur={() => { if (str === '' || isNaN(Number(str))) { setStr('0'); onChange(0); } }}
      {...rest}
    />
  );
}

export function AccessoriesPOS() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id' | 'source'>>(emptyForm);
  const [warrantyMode, setWarrantyMode] = useState<string>('0');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<{ items: CartItem[]; total: number; date: string; id: string; customer: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const bName = profile?.business_name || 'Mi Taller';
  const bAddress = profile?.address ? `${profile.address}${profile.city ? `, ${profile.city}` : ''}` : '';
  const logoUrl = (profile as any)?.logo_url as string | undefined;

  const load = async () => {
    const [gRes, mRes] = await Promise.all([
      supabase
        .from('general_products')
        .select('id,category,product_name,stock,cost_price,sale_price,warranty_days')
        .order('product_name'),
      supabase
        .from('modules_inventory')
        .select('id,brand,model,quality,color,stock,cost_price,sale_price')
        .order('brand'),
    ]);
    if (gRes.error) { toast.error('Error al cargar productos'); return; }
    if (mRes.error) { toast.error('Error al cargar módulos'); return; }
    const generals: Product[] = (gRes.data || []).map((p: any) => ({
      id: p.id,
      category: p.category || '',
      product_name: p.product_name,
      stock: p.stock || 0,
      cost_price: p.cost_price || 0,
      sale_price: p.sale_price || 0,
      warranty_days: p.warranty_days || 0,
      source: 'general',
    }));
    const modules: Product[] = (mRes.data || []).map((m: any) => ({
      id: m.id,
      category: 'Módulos',
      product_name: [m.brand, m.model, m.quality, m.color].filter(Boolean).join(' · '),
      stock: m.stock || 0,
      cost_price: m.cost_price || 0,
      sale_price: m.sale_price || 0,
      warranty_days: 0,
      source: 'module',
    }));
    setProducts([...generals, ...modules]);
  };
  useEffect(() => { load(); }, [user?.id]);

  // Realtime sync across devices
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`pos-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'general_products', filter: `user_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules_inventory', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return products;
    return products.filter(p => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (p: Product) => {
    if (p.source === 'module') {
      toast.info('Editá los módulos desde "Inventario de Módulos".');
      return;
    }
    setEditingId(p.id);
    setForm({
      category: p.category, product_name: p.product_name, stock: p.stock,
      cost_price: p.cost_price, sale_price: p.sale_price,
      warranty_days: p.warranty_days || 0,
    });
    const w = p.warranty_days || 0;
    setWarrantyMode(WARRANTY_PRESETS.includes(w) ? String(w) : 'custom');
    setOpen(true);
  };

  const saveProduct = async () => {
    if (!user) return;
    if (!form.product_name.trim()) { toast.error('El nombre es obligatorio'); return; }
    const payload = {
      category: form.category.trim(),
      product_name: form.product_name.trim(),
      stock: Number(form.stock) || 0,
      cost_price: Number(form.cost_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      warranty_days: Number(form.warranty_days) || 0,
    };
    if (editingId) {
      const { error } = await supabase.from('general_products').update(payload).eq('id', editingId);
      if (error) { toast.error('Error al actualizar'); return; }
      toast.success('Producto actualizado');
    } else {
      const { error } = await supabase.from('general_products').insert({ ...payload, user_id: user.id });
      if (error) { toast.error('Error al crear'); return; }
      toast.success('Producto agregado');
    }
    setOpen(false);
    await load();
  };

  const removeProduct = async (id: string) => {
    const p = products.find(p => p.id === id);
    if (p?.source === 'module') {
      toast.info('Eliminá los módulos desde "Inventario de Módulos".');
      return;
    }
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('general_products').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setCart(c => c.filter(i => i.id !== id));
    await load();
  };

  const addToCart = (p: Product) => {
    if ((p.stock || 0) <= 0) { toast.error('Sin stock disponible'); return; }
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) {
        if (ex.qty + 1 > p.stock) { toast.error('Sin stock suficiente'); return prev; }
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id: p.id, product_name: p.product_name, sale_price: p.sale_price,
        qty: 1, stock: p.stock, source: p.source, warranty_days: p.warranty_days || 0,
      }];
    });
  };

  const changeQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(i => {
      if (i.id !== id) return [i];
      const next = i.qty + delta;
      if (next <= 0) return [];
      if (next > i.stock) { toast.error('Sin stock suficiente'); return [i]; }
      return [{ ...i, qty: next }];
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateCartPrice = (id: string, price: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, sale_price: Math.max(0, price) } : i));
  };

  const total = useMemo(() => cart.reduce((s, i) => s + i.sale_price * i.qty, 0), [cart]);

  const stockBadge = (n: number) => {
    if (n <= 0) return <Badge variant="destructive">Sin Stock</Badge>;
    if (n <= 3) return <Badge className="bg-yellow-500 text-black hover:bg-yellow-500">Stock Bajo ({n})</Badge>;
    return <Badge variant="secondary">{n}</Badge>;
  };

  const confirmSale = async () => {
    if (!user || cart.length === 0) return;
    setBusy(true);
    try {
      const items_sold = cart.map(i => ({
        id: i.id, name: i.product_name, qty: i.qty, price: i.sale_price,
        subtotal: i.qty * i.sale_price, source: i.source, warranty_days: i.warranty_days,
      }));
      const { data: sale, error: insErr } = await supabase
        .from('sales_history')
        .insert({ user_id: user.id, items_sold, total_amount: total, customer_name: customerName.trim() || 'Consumidor Final' } as any)
        .select('id,created_at')
        .single();
      if (insErr) throw insErr;
      // Decrement stock from the right table per item source
      await Promise.all(cart.map(async i => {
        const p = products.find(p => p.id === i.id);
        const newStock = Math.max(0, (p?.stock || 0) - i.qty);
        const table = i.source === 'module' ? 'modules_inventory' : 'general_products';
        await supabase.from(table).update({ stock: newStock }).eq('id', i.id);
      }));
      // Register sale in Caja del Día
      const today = new Date().toISOString().split('T')[0];
      const itemsLabel = cart.length === 1
        ? cart[0].product_name
        : `${cart.length} artículos`;
      await supabase.from('cash_entries').insert({
        user_id: user.id,
        date: today,
        order_id: 0,
        client_name: customerName.trim() || 'Consumidor Final',
        amount: total,
        concept: `Accesorios - ${itemsLabel}`,
      });
      setLastSale({ items: cart, total, date: sale?.created_at || new Date().toISOString(), id: sale?.id || '', customer: customerName.trim() || 'Consumidor Final' });
      setCart([]);
      setCustomerName('');
      setReceiptOpen(true);
      toast.success('Venta confirmada');
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Error al confirmar venta');
    } finally { setBusy(false); }
  };

  const genReceiptBlob = async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;
    const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, logging: false });
    return await new Promise(res => canvas.toBlob(b => res(b), 'image/png', 0.95));
  };

  const downloadReceipt = async () => {
    const blob = await genReceiptBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Recibo-Venta-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const shareReceipt = async () => {
    const blob = await genReceiptBlob();
    if (!blob) return;
    const file = new File([blob], `Recibo-Venta.png`, { type: 'image/png' });
    const nav = navigator as any;
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try { await nav.share({ files: [file], title: 'Recibo de Compra' }); }
      catch (e: any) { if (e?.name !== 'AbortError') toast.error(e?.message); }
    } else {
      await downloadReceipt();
      toast.info('Imagen descargada. Adjuntala en WhatsApp.');
      window.open('https://wa.me/', '_blank');
    }
  };

  const printReceipt = () => {
    const w = window.open('', '_blank'); if (!w || !lastSale) return;
    w.document.write(`<html><head><title>Recibo</title></head><body>${receiptRef.current?.outerHTML || ''}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Inventario General</h2>
          <p className="text-xs text-muted-foreground">Punto de venta de mostrador</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LEFT: Stock */}
        <div className="lg:col-span-3 bg-card rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />Agregar Artículo al Stock</Button>
          </div>
          <div className="p-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Precio Gremio</TableHead>
                  <TableHead className="text-right">Venta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Sin productos</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">
                      {p.source === 'module' ? (
                        <Badge className="bg-purple-600 hover:bg-purple-600 text-white border-0">Módulo</Badge>
                      ) : (p.category || '—')}
                    </TableCell>
                    <TableCell className="font-medium">{p.product_name}</TableCell>
                    <TableCell>{stockBadge(p.stock || 0)}</TableCell>
                    <TableCell className="text-right font-mono">{money(p.cost_price)}</TableCell>
                    <TableCell className="text-right font-mono">{money(p.sale_price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8" onClick={() => addToCart(p)}>
                          <Plus className="h-3.5 w-3.5" />Añadir a la Venta
                        </Button>
                        {p.source === 'general' && (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeProduct(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* RIGHT: Cart */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm flex flex-col">
          <div className="p-4 border-b flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <h3 className="font-bold">Carrito de Venta</h3>
            <Badge variant="secondary" className="ml-auto">{cart.length} ítem{cart.length !== 1 ? 's' : ''}</Badge>
          </div>
          <div className="p-3 border-b space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Nombre del Cliente (opcional)</Label>
            <Input
              placeholder="Consumidor Final"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="p-3 space-y-2 flex-1 max-h-[500px] overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Agregá productos desde el catálogo</p>
            ) : cart.map(i => (
              <div key={i.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium text-sm flex-1">{i.product_name}</p>
                  <Button size="icon" variant="ghost" className="h-6 w-6 -mt-1 -mr-1" onClick={() => removeFromCart(i.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[10px] text-muted-foreground shrink-0">Precio c/u</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    className="h-7 text-xs"
                    value={i.sale_price}
                    onFocus={e => { if (e.target.value === '0') e.target.select(); }}
                    onChange={e => updateCartPrice(i.id, Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => changeQty(i.id, -1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-[2rem] text-center font-mono font-bold">{i.qty}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => changeQty(i.id, 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">{money(i.sale_price)} c/u</p>
                    <p className="font-mono font-bold">{money(i.sale_price * i.qty)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-muted-foreground">TOTAL A PAGAR</span>
              <span className="text-2xl font-bold font-mono text-primary">{money(total)}</span>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={cart.length === 0 || busy} onClick={confirmSale}>
              <Receipt className="h-4 w-4 mr-2" />
              Confirmar Venta y Generar Recibo
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Producto' : 'Agregar Artículo al Stock'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Categoría</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Cables / Cargadores / Vidrios..." />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Nombre del Producto</Label>
              <Input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))} placeholder="Ej: Cable USB-C 1m" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cantidad Inicial</Label>
              <NumInput value={form.stock} onChange={n => setForm(f => ({ ...f, stock: n }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Precio Gremio</Label>
              <NumInput value={form.cost_price} onChange={n => setForm(f => ({ ...f, cost_price: n }))} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Precio Venta</Label>
              <NumInput value={form.sale_price} onChange={n => setForm(f => ({ ...f, sale_price: n }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Días de Garantía</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={warrantyMode}
                onChange={e => {
                  const v = e.target.value;
                  setWarrantyMode(v);
                  if (v !== 'custom') {
                    setForm(f => ({ ...f, warranty_days: Number(v) || 0 }));
                  }
                }}
              >
                <option value="0">Sin garantía</option>
                <option value="30">30 días</option>
                <option value="90">90 días</option>
                <option value="180">180 días</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            {warrantyMode === 'custom' && (
              <div className="space-y-1">
                <Label className="text-xs">Días personalizados</Label>
                <NumInput value={form.warranty_days || 0} onChange={n => setForm(f => ({ ...f, warranty_days: n }))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={saveProduct}>{editingId ? 'Guardar' : 'Agregar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recibo de Compra</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div ref={receiptRef} className="space-y-3 font-mono text-sm border rounded-lg p-5 bg-white text-black">
              <div className="text-center border-b border-dashed border-gray-400 pb-3">
                {logoUrl && <img src={logoUrl} alt={bName} crossOrigin="anonymous" className="h-14 w-14 rounded-full object-cover mx-auto mb-2 border" />}
                <p className="text-lg font-bold">{bName}</p>
                {bAddress && <p className="text-[10px] opacity-70">{bAddress}</p>}
                <p className="text-xs opacity-70 mt-1">Recibo · {new Date(lastSale.date).toLocaleString('es-AR')}</p>
                <p className="text-xs font-semibold mt-1">Cliente: {lastSale.customer}</p>
              </div>
              <div className="space-y-1.5">
                {lastSale.items.map((i, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="flex-1">{i.qty} x {i.product_name}</span>
                      <span className="font-mono">{money(i.sale_price * i.qty)}</span>
                    </div>
                    {i.warranty_days > 0 && (
                      <div className="text-[10px] opacity-70 pl-3">
                        Garantía: {i.warranty_days} días
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-400 pt-2 flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span className="font-mono">{money(lastSale.total)}</span>
              </div>
              <div className="text-center text-xs opacity-70 pt-1">¡Gracias por su compra!</div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>Cerrar</Button>
            <Button variant="outline" className="gap-2" onClick={downloadReceipt}><Download className="h-4 w-4" />Descargar</Button>
            <Button variant="outline" className="gap-2" onClick={printReceipt}><Printer className="h-4 w-4" />Imprimir</Button>
            <Button className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white" onClick={shareReceipt}>
              <ImageIcon className="h-4 w-4" />Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
