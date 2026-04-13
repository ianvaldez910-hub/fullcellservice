import { useState, useMemo } from 'react';
import { useEquipmentDB, EquipmentItem } from '@/hooks/useEquipmentDB';
import { useAuth } from '@/hooks/useAuth';
import { Equipment, EquipmentStatus } from '@/types/equipment';
import { StatusDashboard } from '@/components/StatusDashboard';
import { EquipmentTable } from '@/components/EquipmentTable';
import { EquipmentForm } from '@/components/EquipmentForm';
import { ReceiptDialog } from '@/components/ReceiptDialog';
import { CashRegister } from '@/components/CashRegister';
import { FinancialSummary } from '@/components/FinancialSummary';
import { BusinessProfileSettings } from '@/components/BusinessProfileSettings';
import { AdminPanel } from '@/components/AdminPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Plus, Search, Wrench, LayoutDashboard, Settings, Banknote, Shield, LogOut, Zap } from 'lucide-react';
import { toast } from 'sonner';

type Page = 'dashboard' | 'settings' | 'cash' | 'admin';

function itemToEquipment(item: EquipmentItem): Equipment {
  return {
    id: item.orderNumber,
    clientName: item.clientName,
    phone: item.phone,
    altPhone: item.altPhone,
    brand: item.brand,
    model: item.model,
    security: item.security,
    securityPattern: item.securityPattern,
    dateIn: item.dateIn,
    dateEstimated: item.dateEstimated,
    problem: item.problem,
    budget: item.budget,
    deposit: item.deposit,
    status: item.status,
    warranty: item.warranty as any,
    internalNotes: item.internalNotes,
    images: item.images,
    hasHumidity: item.hasHumidity,
  };
}

export default function Index() {
  const { items, addEquipment, updateEquipment, deleteEquipment, getStatusCounts } = useEquipmentDB();
  const { profile, isAdmin, signOut, trialDaysLeft } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | undefined>();
  const [receiptItem, setReceiptItem] = useState<Equipment | null>(null);
  const [page, setPage] = useState<Page>('dashboard');

  const equipmentList = useMemo(() => items.map(itemToEquipment), [items]);

  const filtered = useMemo(() => {
    let result = equipmentList;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.clientName.toLowerCase().includes(q) ||
        i.model.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        String(i.id).includes(q)
      );
    }
    if (statusFilter) result = result.filter(i => i.status === statusFilter);
    return result.sort((a, b) => b.id - a.id);
  }, [equipmentList, search, statusFilter]);

  const dailySummary = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayItems = equipmentList.filter(i => i.dateIn === today);
    const delivered = todayItems.filter(i => i.status === 'Entregado');
    const totalDelivered = delivered.reduce((s, i) => s + (i.budget || 0), 0);
    const totalDeposits = todayItems.filter(i => i.status !== 'Entregado').reduce((s, i) => s + (i.deposit || 0), 0);
    return { totalDelivered, totalDeposits, total: totalDelivered + totalDeposits };
  }, [equipmentList]);

  const handleAdd = () => { setEditingItem(undefined); setFormOpen(true); };
  const handleEdit = (item: Equipment) => {
    const dbItem = items.find(i => i.orderNumber === item.id);
    if (dbItem) { setEditingItem(dbItem); setFormOpen(true); }
  };

  const handleSubmit = async (data: Omit<Equipment, 'id'>) => {
    if (editingItem) {
      await updateEquipment(editingItem.id, {
        clientName: data.clientName, phone: data.phone, altPhone: data.altPhone,
        brand: data.brand, model: data.model, security: data.security,
        securityPattern: data.securityPattern, dateIn: data.dateIn,
        dateEstimated: data.dateEstimated, problem: data.problem,
        budget: data.budget, deposit: data.deposit, status: data.status,
        warranty: data.warranty, internalNotes: data.internalNotes,
        images: data.images, hasHumidity: data.hasHumidity,
      });
      toast.success(`Orden #${editingItem.orderNumber} actualizada`);
    } else {
      await addEquipment(data);
      toast.success('Nueva orden creada');
    }
  };

  const handleDelete = async (id: number) => {
    const dbItem = items.find(i => i.orderNumber === id);
    if (dbItem && confirm(`¿Eliminar la orden #${id}?`)) {
      await deleteEquipment(dbItem.id);
      toast.success(`Orden #${id} eliminada`);
    }
  };

  const handleStatusChange = async (id: number, status: EquipmentStatus) => {
    const dbItem = items.find(i => i.orderNumber === id);
    if (dbItem) {
      await updateEquipment(dbItem.id, { status });
      toast.success(`Estado actualizado a "${status}"`);
    }
  };

  const bName = profile?.business_name || 'FullCell Service';

  const menuItems = [
    { title: 'Panel Principal', page: 'dashboard' as Page, icon: LayoutDashboard },
    { title: 'Caja del Día', page: 'cash' as Page, icon: Banknote },
    { title: 'Ajustes', page: 'settings' as Page, icon: Settings },
    ...(isAdmin ? [{ title: 'Administración', page: 'admin' as Page, icon: Shield }] : []),
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span>{bName}</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map(item => (
                    <SidebarMenuItem key={item.page}>
                      <SidebarMenuButton
                        onClick={() => setPage(item.page)}
                        className={page === item.page ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={signOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          {profile?.license_status === 'trial' && trialDaysLeft > 0 && (
            <div className="bg-yellow-500/15 border-b border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-center text-sm py-2 px-4 font-medium">
              ⏳ Tu prueba gratuita vence en {trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''}. Contactá al administrador para activar tu licencia.
            </div>
          )}
          <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="mr-1" />
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight">{bName}</h1>
                  <p className="text-xs text-muted-foreground">Gestión de Servicio Técnico</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {page === 'dashboard' && (
                  <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" /> Nueva Orden
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
            {page === 'dashboard' && (
              <>
                <StatusDashboard counts={getStatusCounts()} onFilterByStatus={setStatusFilter} activeFilter={statusFilter} />

                <div className="bg-card rounded-xl border shadow-sm">
                  <div className="p-4 border-b flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Buscar por cliente, modelo o # orden..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <span className="text-sm text-muted-foreground">{filtered.length} equipo{filtered.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="p-4">
                    <EquipmentTable
                      items={filtered}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      onReceipt={setReceiptItem}
                      businessName={bName}
                    />
                  </div>
                </div>

                <FinancialSummary items={equipmentList} />

                {/* Daily Summary with Instant Calculation */}
                <div className="bg-card rounded-xl border shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-status-ready" />
                    <h2 className="font-bold text-lg">Resumen del Día</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <span className="text-xs font-medium text-muted-foreground">Cobros por entregas</span>
                      <p className="text-2xl font-bold font-mono text-status-ready">${dailySummary.totalDelivered.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <span className="text-xs font-medium text-muted-foreground">Señas cobradas hoy</span>
                      <p className="text-2xl font-bold font-mono text-status-repair">${dailySummary.totalDeposits.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <span className="text-xs font-medium text-muted-foreground">Total del día</span>
                      <p className="text-2xl font-bold font-mono text-primary">${dailySummary.total.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {page === 'cash' && <CashRegister />}
            {page === 'settings' && <BusinessProfileSettings />}
            {page === 'admin' && (isAdmin ? <AdminPanel /> : (() => { window.location.href = '/unauthorized'; return null; })())}
          </main>
        </div>
      </div>

      <EquipmentForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} initialData={editingItem ? itemToEquipment(editingItem) : undefined} />
      <ReceiptDialog open={!!receiptItem} onClose={() => setReceiptItem(null)} item={receiptItem} />
    </SidebarProvider>
  );
}
