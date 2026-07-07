import { useState, useEffect, useRef } from 'react';
import { useReceiptSettings, ReceiptSettings } from '@/hooks/useReceiptSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Upload, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const FONT_OPTIONS = [
  { value: 'Plus Jakarta Sans, system-ui, sans-serif', label: 'Moderna (Sans-Serif)' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Clásica (Serif)' },
  { value: '"Courier New", Courier, monospace', label: 'Tiquetera Térmica (Monospace)' },
];

const money = (n: number) => `$${(Number(n) || 0).toLocaleString('es-AR')}`;

export function ReceiptDesignSettings() {
  const { user, profile } = useAuth();
  const { settings, save } = useReceiptSettings();
  const [draft, setDraft] = useState<ReceiptSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(settings); }, [settings]);

  // Cleanup object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const set = <K extends keyof ReceiptSettings>(k: K, v: ReceiptSettings[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const onUpload = async (file: File) => {
    if (!user) {
      toast.error('Debes iniciar sesión para subir un logo');
      return;
    }
    if (!/^image\//i.test(file.type)) {
      toast.error('El archivo debe ser una imagen (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 5MB');
      return;
    }

    // 1) Instant local preview
    const objectUrl = URL.createObjectURL(file);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(objectUrl);

    // 2) Loading toast
    const loadingId = toast.loading('Procesando y subiendo logotipo...');
    setUploading(true);

    try {
      // Sanitize filename: remove accents, special chars, spaces
      const rawName = file.name.replace(/\.[^.]+$/, '');
      const safeName = rawName
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase()
        .slice(0, 40) || 'logo';
      const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
      // RLS requires first folder = auth.uid()
      const path = `${user.id}/receipt-${safeName}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('workshop_logos')
        .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });

      if (upErr) {
        console.error('[receipt-logo-upload][storage]', upErr);
        toast.dismiss(loadingId);
        toast.error(`Error al subir imagen: ${upErr.message}`);
        return;
      }

      const { data } = supabase.storage.from('workshop_logos').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      // 3) Update draft immediately and persist to DB so the receipt uses it right away
      const next = { ...draft, logo_url: publicUrl };
      set('logo_url', publicUrl);

      const { error: saveErr } = await save(next);
      if (saveErr) {
        console.error('[receipt-logo-upload][db]', saveErr);
        toast.dismiss(loadingId);
        toast.error(`Error al guardar configuración: ${saveErr.message || saveErr}`);
        return;
      }

      toast.dismiss(loadingId);
      toast.success('¡Logotipo guardado y aplicado con éxito!');

      // Once the remote URL is live, revoke the local blob preview
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
    } catch (e: any) {
      console.error('[receipt-logo-upload][unexpected]', e);
      toast.dismiss(loadingId);
      toast.error(`Error inesperado: ${e?.message || 'desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    const { error } = await save(draft);
    setSaving(false);
    if (error) { toast.error(error.message || 'Error al guardar'); return; }
    toast.success('Configuración del recibo guardada');
  };

  const bName = profile?.business_name || 'Mi Taller';

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-pink-600 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Configuración del Recibo de Venta</h2>
          <p className="text-xs text-muted-foreground">Personalizá el diseño de la nota de venta impresa o digital.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CONTROLS */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Logotipo del taller</Label>
            <div className="flex items-center gap-3">
              {draft.logo_url ? (
                <img src={draft.logo_url} alt="logo" className="h-16 w-16 rounded-lg object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">sin logo</div>
              )}
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" /> {uploading ? 'Subiendo…' : 'Cambiar logo'}
                </Button>
                {draft.logo_url && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => set('logo_url', null)} className="gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" /> Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipografía</Label>
            <Select value={draft.font_family} onValueChange={v => set('font_family', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Fondo</Label>
              <Input type="color" value={draft.bg_color} onChange={e => set('bg_color', e.target.value)} className="h-10 p-1" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Acento</Label>
              <Input type="color" value={draft.accent_color} onChange={e => set('accent_color', e.target.value)} className="h-10 p-1" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Texto</Label>
              <Input type="color" value={draft.text_color} onChange={e => set('text_color', e.target.value)} className="h-10 p-1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Encabezado (dirección, teléfono, CUIT…)</Label>
            <Textarea rows={3} value={draft.header_text} onChange={e => set('header_text', e.target.value)} placeholder="Av. Siempreviva 742 · Tel: 11 2345-6789" />
          </div>

          <div className="space-y-2">
            <Label>Pie de página / garantía</Label>
            <Textarea rows={3} value={draft.footer_text} onChange={e => set('footer_text', e.target.value)} placeholder="Garantía de 30 días sobre repuestos. ¡Gracias por su compra!" />
          </div>

          <Button onClick={onSave} disabled={saving} className="w-full bg-pink-600 hover:bg-pink-700 text-white gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar Configuración'}
          </Button>
        </div>

        {/* LIVE PREVIEW */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Vista previa</Label>
          <div className="rounded-xl border p-4 bg-muted/30 flex items-center justify-center">
            <div
              style={{
                background: draft.bg_color,
                color: draft.text_color,
                fontFamily: draft.font_family,
                width: '100%',
                maxWidth: 320,
                padding: 16,
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: `2px dashed ${draft.accent_color}`, paddingBottom: 10, marginBottom: 12 }}>
                {draft.logo_url && <img src={draft.logo_url} alt="logo" style={{ height: 48, width: 48, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px' }} />}
                <div style={{ fontWeight: 700, color: draft.accent_color }}>{bName}</div>
                {draft.header_text && <div style={{ fontSize: 10, opacity: 0.85, whiteSpace: 'pre-line' }}>{draft.header_text}</div>}
              </div>
              <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                <span>Nota #ABC12345</span><span>27/06/2026</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}><strong>Cliente:</strong> Técnico Facundo</div>
              <div style={{ fontSize: 12, marginBottom: 8 }}><strong>Pago:</strong> Efectivo</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${draft.accent_color}` }}>
                    <th style={{ textAlign: 'left', padding: '3px 0' }}>Detalle</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>Sub.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ padding: '3px 0' }}>Pin de carga Tipo C</td><td style={{ textAlign: 'center' }}>2</td><td style={{ textAlign: 'right' }}>{money(8000)}</td></tr>
                  <tr><td style={{ padding: '3px 0' }}>Módulo Samsung A54</td><td style={{ textAlign: 'center' }}>1</td><td style={{ textAlign: 'right' }}>{money(85000)}</td></tr>
                </tbody>
              </table>
              <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 6, background: draft.accent_color, color: '#fff', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>TOTAL</span><span>{money(93000)}</span>
              </div>
              {draft.footer_text && <div style={{ textAlign: 'center', fontSize: 10, marginTop: 10, whiteSpace: 'pre-line', opacity: 0.85 }}>{draft.footer_text}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}