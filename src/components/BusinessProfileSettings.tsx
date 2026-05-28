import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileDB } from '@/hooks/useProfileDB';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Store, MessageCircle, MapPin, Clock, ImagePlus, Trash2 } from 'lucide-react';

export function BusinessProfileSettings() {
  const { profile, user, refreshProfile } = useAuth();
  const { updateProfile } = useProfileDB();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const logoUrl = (profile as any)?.logo_url as string | null | undefined;

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

  const handlePickLogo = () => fileRef.current?.click();

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      toast.error('Solo se permiten archivos PNG o JPG');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('workshop_logos')
        .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('workshop_logos').getPublicUrl(path);
      await updateProfile({ logo_url: pub.publicUrl });
      await refreshProfile();
      toast.success('Logo actualizado');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    await updateProfile({ logo_url: null });
    await refreshProfile();
    toast.success('Logo eliminado');
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
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logotipo del Negocio</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handlePickLogo} disabled={uploading}>
                <ImagePlus className="h-4 w-4" />
                {uploading ? 'Subiendo...' : (logoUrl ? 'Cambiar Logo' : 'Subir Imagen')}
              </Button>
              {logoUrl && (
                <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive" onClick={handleRemoveLogo}>
                  <Trash2 className="h-3.5 w-3.5" />Quitar
                </Button>
              )}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">PNG o JPG. Se mostrará en el panel lateral y en los recibos.</p>
        </div>

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

        <div className="mt-6 rounded-lg border border-dashed p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Renovar Licencia</p>
          <p className="text-xs text-muted-foreground">¿Necesitás extender tu plan? Contactá con administración antes de que venza tu acceso.</p>
          <Button
            className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white"
            onClick={() => window.open('https://wa.me/543873695394?text=Hola%2C%20mi%20licencia%20de%20FullCell%20Service%20ha%20vencido.%20Solicito%20informaci%C3%B3n%20para%20renovar%20mi%20plan%20de%20acceso.', '_blank')}
          >
            <MessageCircle className="h-4 w-4" />
            Contactar con Administración
          </Button>
        </div>
      </div>
    </div>
  );
}
