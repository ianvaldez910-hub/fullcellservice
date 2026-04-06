import { useState, useMemo } from 'react';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment, EquipmentStatus } from '@/types/equipment';
import { StatusDashboard } from '@/components/StatusDashboard';
import { EquipmentTable } from '@/components/EquipmentTable';
import { EquipmentForm } from '@/components/EquipmentForm';
import { ReceiptDialog } from '@/components/ReceiptDialog';
import { CashRegister } from '@/components/CashRegister';
import { FinancialSummary } from '@/components/FinancialSummary';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function Index() {
  const { items, addEquipment, updateEquipment, deleteEquipment, getStatusCounts } = useEquipment();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | undefined>();
  const [receiptItem, setReceiptItem] = useState<Equipment | null>(null);

  const filtered = useMemo(() => {
    let result = items;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.clientName.toLowerCase().includes(q) ||
        i.model.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q) ||
        String(i.id).includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter(i => i.status === statusFilter);
    }
    return result.sort((a, b) => b.id - a.id);
  }, [items, search, statusFilter]);

  const handleAdd = () => {
    setEditingItem(undefined);
    setFormOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleSubmit = (data: Omit<Equipment, 'id'>) => {
    if (editingItem) {
      updateEquipment(editingItem.id, data);
      toast.success(`Orden #${editingItem.id} actualizada`);
    } else {
      addEquipment(data);
      toast.success('Nueva orden creada');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(`¿Eliminar la orden #${id}?`)) {
      deleteEquipment(id);
      toast.success(`Orden #${id} eliminada`);
    }
  };

  const handleStatusChange = (id: number, status: EquipmentStatus) => {
    updateEquipment(id, { status });
    toast.success(`Estado actualizado a "${status}"`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">FullCell Service</h1>
              <p className="text-xs text-muted-foreground">Gestión de Servicio Técnico</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Orden
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dashboard */}
        <StatusDashboard
          counts={getStatusCounts()}
          onFilterByStatus={setStatusFilter}
          activeFilter={statusFilter}
        />

        {/* Search & Table */}
        <div className="bg-card rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, modelo o # orden..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {filtered.length} equipo{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4">
            <EquipmentTable
              items={filtered}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onReceipt={setReceiptItem}
            />
          </div>
        </div>

        {/* Resumen Financiero */}
        <FinancialSummary items={items} />

        {/* Caja */}
        <CashRegister />
      </main>

      {/* Modals */}
      <EquipmentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingItem}
      />
      <ReceiptDialog
        open={!!receiptItem}
        onClose={() => setReceiptItem(null)}
        item={receiptItem}
      />
    </div>
  );
}
