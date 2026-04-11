import { useState, useRef } from 'react';
import { Equipment, STATUS_OPTIONS, EquipmentStatus, WARRANTY_OPTIONS, WarrantyDays } from '@/types/equipment';
import { Checkbox } from '@/components/ui/checkbox';
import { PatternDrawer } from '@/components/PatternDrawer';
import { validateArgPhone } from '@/lib/whatsapp';
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
import { Camera, X } from 'lucide-react';

interface EquipmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Equipment, 'id'>) => void;
  initialData?: Equipment;
}

export function EquipmentForm({ open, onClose, onSubmit, initialData }: EquipmentFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    clientName: initialData?.clientName ?? '',
    phone: initialData?.phone ?? '',
    altPhone: initialData?.altPhone ?? '',
    brand: initialData?.brand ?? '',
    model: initialData?.model ?? '',
    security: initialData?.security ?? '',
    securityPattern: initialData?.securityPattern ?? [] as number[],
    dateIn: initialData?.dateIn ?? today,
    dateEstimated: initialData?.dateEstimated ?? '',
    problem: initialData?.problem ?? '',
    budget: initialData?.budget ?? 0,
    deposit: initialData?.deposit ?? 0,
    status: initialData?.status ?? ('Pendiente' as EquipmentStatus),
    warranty: initialData?.warranty ?? (0 as WarrantyDays),
    internalNotes: initialData?.internalNotes ?? '',
    images: initialData?.images ?? [] as string[],
    hasHumidity: initialData?.hasHumidity ?? false,
  });

  const handleChange = (field: string, value: string | number | number[] | string[] | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 2 * 1024 * 1024) return; // max 2MB per image
      const reader = new FileReader();
      reader.onload = () => {
        setForm(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phone && !validateArgPhone(form.phone)) {
      alert('El teléfono principal no tiene un formato válido (ej: 1155667788)');
      return;
    }
    if (form.altPhone && !validateArgPhone(form.altPhone)) {
      alert('El teléfono alternativo no tiene un formato válido');
      return;
    }
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
            <Input placeholder="Nombre y Apellido" value={form.clientName} onChange={e => handleChange('clientName', e.target.value)} required />
          </div>

          {/* Teléfonos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📱 Teléfono Principal *</Label>
              <Input
                placeholder="Ej: 1155667788"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                required
                inputMode="numeric"
              />
              <p className="text-[10px] text-muted-foreground">Sin 0 ni 15. Ej: código de área + número</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📞 Tel. Alternativo</Label>
              <Input
                placeholder="Ej: 1144556677"
                value={form.altPhone}
                onChange={e => handleChange('altPhone', e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
              />
              <p className="text-[10px] text-muted-foreground">Contacto alternativo (opcional)</p>
            </div>
          </div>

          {/* Equipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marca</Label>
              <Input placeholder="Ej: Samsung" value={form.brand} onChange={e => handleChange('brand', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modelo</Label>
              <Input placeholder="Ej: Galaxy S24" value={form.model} onChange={e => handleChange('model', e.target.value)} required />
            </div>
          </div>

          {/* Seguridad dual */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🔒 Seguridad</Label>
            <Input placeholder="PIN o contraseña de desbloqueo" value={form.security} onChange={e => handleChange('security', e.target.value)} />
            <PatternDrawer value={form.securityPattern} onChange={p => handleChange('securityPattern', p)} />
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
            <Textarea placeholder="Describe el problema del equipo..." value={form.problem} onChange={e => handleChange('problem', e.target.value)} rows={3} required />
          </div>

          {/* Presupuesto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presupuesto ($)</Label>
              <Input type="number" min={0} value={form.budget || ''} onChange={e => handleChange('budget', Number(e.target.value))} onFocus={e => { if (Number(e.target.value) === 0) e.target.value = ''; }} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seña ($)</Label>
              <Input type="number" min={0} value={form.deposit || ''} onChange={e => handleChange('deposit', Number(e.target.value))} onFocus={e => { if (Number(e.target.value) === 0) e.target.value = ''; }} />
            </div>
          </div>

          {/* Estado + Garantía */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</Label>
              <Select value={form.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🛡️ Garantía</Label>
              <Select value={String(form.warranty)} onValueChange={v => handleChange('warranty', Number(v) as WarrantyDays)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WARRANTY_OPTIONS.map(w => (<SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fotos del equipo */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📸 Fotos del Estado Físico</Label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                  <img src={img} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[10px] mt-1">Agregar</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <p className="text-[10px] text-muted-foreground">Máx. 2MB por imagen. Documentá rayas, golpes o detalles previos.</p>
          </div>

          {/* Evidencia de Humedad */}
          <div className="flex items-start space-x-3 rounded-lg border border-dashed border-status-waiting p-4 bg-status-waiting/5">
            <Checkbox
              id="hasHumidity"
              checked={form.hasHumidity}
              onCheckedChange={(checked) => handleChange('hasHumidity', checked === true)}
            />
            <div className="space-y-1 leading-none">
              <label htmlFor="hasHumidity" className="text-sm font-medium cursor-pointer">
                💧 Evidencia de Humedad / Sulfato
              </label>
              <p className="text-[10px] text-muted-foreground">
                Marcar si el equipo presenta rastros de humedad o corrosión al ingreso
              </p>
            </div>
          </div>

          {/* Observaciones Internas */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">🔒 Observaciones Internas</Label>
            <Textarea placeholder="Repuestos usados, detalles estéticos previos, notas internas..." value={form.internalNotes} onChange={e => handleChange('internalNotes', e.target.value)} rows={2} className="border-dashed" />
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
