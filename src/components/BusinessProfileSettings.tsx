import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileDB } from '@/hooks/useProfileDB';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Store, MessageCircle, MapPin, Clock } from 'lucide-react';

export function BusinessProfileSettings() {
  const { profile } = useAuth();
  const { updateProfile } = useProfileDB();

  const [form, setForm] = useState({
    business_name: profile?.business_name || 'Mi Taller',
    whatsapp_number: profile?.whatsapp_number || '',
    email: profile?.email || '',
    address: profile?.address || '',
    city: profile?.city || '',
    business_hours: profile?.business_hours || '',
  });

  const handleSave = async () => {
    await updateProfile(form);
    toast.success('Perfil del negocio guardado');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Ajustes de Perfil</h2>
          <p className="text-xs text-muted-foreground">Datos de tu negocio</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre del Negocio</Label>
          <Input
            placeholder="Ej: FullCell Service"
            value={form.business_name}
            onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageCircle className="inline h-3 w-3 mr-1" />
            WhatsApp del Negocio
          </Label>
          <Input
            placeholder="Ej: 1155667788"
            value={form.whatsapp_number}
            onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value.replace(/\D/g, '') }))}
            inputMode="numeric"
          />
          <p className="text-[10px] text-muted-foreground">Número sin 0 ni 15 (formato Argentina)</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo Electrónico</Label>
          <Input
            type="email"
            placeholder="taller@email.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="inline h-3 w-3 mr-1" />
            Dirección del Taller
          </Label>
          <Input
            placeholder="Ej: Av. Corrientes 1234"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ciudad</Label>
          <Input
            placeholder="Ej: Buenos Aires"
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            Horario de Atención
          </Label>
          <Input
            placeholder="Ej: Lun-Vie 9:00-18:00"
            value={form.business_hours}
            onChange={e => setForm(f => ({ ...f, business_hours: e.target.value }))}
          />
        </div>

        <Button onClick={handleSave} className="w-full">Guardar Cambios</Button>
      </div>
    </div>
  );
}
