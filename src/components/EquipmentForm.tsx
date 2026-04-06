import { useState } from 'react';
import { Equipment, STATUS_OPTIONS, EquipmentStatus } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
  initialData?: Equipment;
}

export function EquipmentForm({ open, onClose, onSubmit, initialData }: EquipmentFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    clientName: initialData?.clientName ?? '',
    brand: initialData?.brand ?? '',
    model: initialData?.model ?? '',
    security: initialData?.security ?? '',
    dateIn: initialData?.dateIn ?? today,
    dateEstimated: initialData?.dateEstimated ?? '',
    problem: initialData?.problem ?? '',
    budget: initialData?.budget ?? 0,
    deposit: initialData?.deposit ?? 0,
    status: initialData?.status ?? ('Pendiente' as EquipmentStatus),
    internalNotes: initialData?.internalNotes ?? '',
  });

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {initialData ? `Editar Orden #${initialData.id}` : 'Nueva Orden de Servicio'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cliente */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</Label>
            <Input
              placeholder="Nombre y Apellido"
              value={form.clientName}
              onChange={e => handleChange('clientName', e.target.value)}
              required
            />
          </div>

          {/* Equipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marca</Label>
              <Input
                placeholder="Ej: Samsung"
                value={form.brand}
                onChange={e => handleChange('brand', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
              <Input
                placeholder="Ej: Galaxy S24"
                value={form.model}
                onChange={e => handleChange('model', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Seguridad */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patrón / Contraseña</Label>
            <Input
              placeholder="Patrón o contraseña de desbloqueo"
              value={form.security}
              onChange={e => handleChange('security', e.target.value)}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha Ingreso</Label>
              <Input type="date" value={form.dateIn} onChange={e => handleChange('dateIn', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha Est. Entrega</Label>
              <Input type="date" value={form.dateEstimated} onChange={e => handleChange('dateEstimated', e.target.value)} />
            </div>
          </div>

          {/* Problema */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problema Reportado</Label>
            <Textarea
              placeholder="Describe el problema del equipo..."
              value={form.problem}
              onChange={e => handleChange('problem', e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Presupuesto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presupuesto ($)</Label>
              <Input
                type="number"
                min={0}
                value={form.budget}
                onChange={e => handleChange('budget', Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seña ($)</Label>
              <Input
                type="number"
                min={0}
                value={form.deposit}
                onChange={e => handleChange('deposit', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</Label>
            <Select value={form.status} onValueChange={v => handleChange('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observaciones Internas */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              🔒 Observaciones Internas
            </Label>
            <Textarea
              placeholder="Repuestos usados, detalles estéticos previos, notas internas..."
              value={form.internalNotes}
              onChange={e => handleChange('internalNotes', e.target.value)}
              rows={2}
              className="border-dashed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{initialData ? 'Guardar Cambios' : 'Crear Orden'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
