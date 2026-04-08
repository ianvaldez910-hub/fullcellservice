import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { Store, MessageCircle } from 'lucide-react';

interface Props {
  profile: BusinessProfile;
  onUpdate: (data: Partial<BusinessProfile>) => void;
}

export function BusinessProfileSettings({ profile, onUpdate }: Props) {
  const [form, setForm] = useState(profile);

  const handleSave = () => {
    onUpdate(form);
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
            value={form.businessName}
            onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
          />
          <p className="text-[10px] text-muted-foreground">Se usa en los mensajes automáticos de WhatsApp</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageCircle className="inline h-3 w-3 mr-1" />
            WhatsApp del Negocio
          </Label>
          <Input
            placeholder="Ej: 1155667788"
            value={form.whatsappNumber}
            onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
            inputMode="numeric"
          />
          <p className="text-[10px] text-muted-foreground">Número sin 0 ni 15 (formato Argentina)</p>
        </div>

        <Button onClick={handleSave} className="w-full">Guardar Cambios</Button>
      </div>
    </div>
  );
}
