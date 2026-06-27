import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Boxes, Wrench, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModulesInventory } from './ModulesInventory';
import { SparePartsInventory } from './SparePartsInventory';
import { SalesCartDrawer, SaleItem, CatalogItem } from './SalesCartDrawer';
import { SalesReceiptDialog, SaleReceiptData } from './SalesReceiptDialog';
import { useAuth } from '@/hooks/useAuth';
import { useReceiptSettings } from '@/hooks/useReceiptSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function InventoryPage() {
  const { isAdmin, profile } = useAuth();
  const { settings } = useReceiptSettings();
  const [tab, setTab] = useState<'modules' | 'parts'>('modules');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [receipt, setReceipt] = useState<SaleReceiptData | null>(null);

  const loadCatalog = useCallback(async () => {
    const [{ data: mods }, { data: parts }] = await Promise.all([
      supabase.from('modules_inventory').select('id,brand,model,quality,color,stock,sale_price'),
      supabase.from('spare_parts' as any).select('id,category,brand,part_type,price,stock'),
    ]);
    const items: CatalogItem[] = [];
    (mods || []).forEach((m: any) => items.push({
      key: `module-${m.id}`, ref_id: m.id, source: 'module',
      name: `${m.brand} ${m.model}${m.color ? ' · ' + m.color : ''}${m.quality ? ' · ' + m.quality : ''}`.trim(),
      category: 'Módulos',
      price: Number(m.sale_price) || 0,
      stock: Number(m.stock) || 0,
    }));
    (parts || []).forEach((p: any) => items.push({
      key: `part-${p.id}`, ref_id: p.id, source: 'part',
      name: `${p.part_type}${p.brand ? ' · ' + p.brand : ''}`,
      category: p.category || 'Repuestos',
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
    }));
    setCatalog(items);
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog, drawerOpen, receipt]);

  const addToSale = (item: { ref_id: string; source: 'module' | 'part'; name: string; category: string; price: number; stock: number }) => {
    const key = `${item.source}-${item.ref_id}`;
    setCart(prev => {
      const ex = prev.find(i => i.key === key);
      if (ex) {
        if (ex.qty + 1 > item.stock) { toast.error('Stock insuficiente'); return prev; }
        return prev.map(i => i.key === key ? { ...i, qty: i.qty + 1, stock: item.stock, price: item.price } : i);
      }
      if (item.stock <= 0) { toast.error('Sin stock'); return prev; }
      return [...prev, { key, ...item, qty: 1 }];
    });
    setDrawerOpen(true);
    toast.success(`${item.name} agregado`);
  };

  return (
    <div className="p-2 sm:p-4 space-y-4 relative">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="grid grid-cols-2 max-w-md">
            <TabsTrigger value="modules" className="gap-2"><Boxes className="h-4 w-4" />Ver Módulos</TabsTrigger>
            <TabsTrigger value="parts" className="gap-2" disabled={!isAdmin}><Wrench className="h-4 w-4" />Ver Repuestos</TabsTrigger>
          </TabsList>
          <Button onClick={() => setDrawerOpen(true)} className="gap-2 bg-pink-600 hover:bg-pink-700 text-white">
            <ShoppingCart className="h-4 w-4" /> Nota de Venta
            {cart.length > 0 && <Badge className="ml-1 bg-white text-pink-700 hover:bg-white">{cart.length}</Badge>}
          </Button>
        </div>
        <TabsContent value="modules" className="mt-4">
          <div key="modules"><ModulesInventory onAddToSale={addToSale} /></div>
        </TabsContent>
        <TabsContent value="parts" className="mt-4">
          <div key="parts">
            {isAdmin ? <SparePartsInventory onAddToSale={addToSale} /> : <div className="text-center text-muted-foreground py-8">Acceso restringido</div>}
          </div>
        </TabsContent>
      </Tabs>

      <SalesCartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cart={cart}
        setCart={setCart}
        catalog={catalog}
        onSaleConfirmed={(sale) => setReceipt(sale)}
      />

      <SalesReceiptDialog
        open={!!receipt}
        onClose={() => setReceipt(null)}
        sale={receipt}
        settings={settings}
        businessName={profile?.business_name || 'Mi Taller'}
      />
    </div>
  );
}