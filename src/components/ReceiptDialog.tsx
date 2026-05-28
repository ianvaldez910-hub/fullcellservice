import { Equipment, STATUS_CONFIG, WARRANTY_OPTIONS } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Share2, Download, Image as ImageIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { openWhatsApp } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  item: Equipment | null;
}

export function ReceiptDialog({ open, onClose, item }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!item) return null;

  const remaining = (item.budget || 0) - (item.deposit || 0);
  const warrantyLabel = WARRANTY_OPTIONS.find(w => w.value === item.warranty)?.label ?? 'Sin garantía';
  const bName = profile?.business_name || 'Mi Taller';
  const bAddress = profile?.address ? `${profile.address}${profile.city ? `, ${profile.city}` : ''}` : '';
  const bHours = profile?.business_hours || '';
  const logoUrl = (profile as any)?.logo_url as string | undefined;

  const generateBlob = async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;
    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return await new Promise(res => canvas.toBlob(b => res(b), 'image/png', 0.95));
  };

  const handleDownloadImage = async () => {
    setBusy(true);
    try {
      const blob = await generateBlob();
      if (!blob) throw new Error('No se pudo generar la imagen');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Recibo-${item.id}-${item.clientName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Imagen descargada');
    } catch (e: any) { toast.error(e?.message || 'Error al generar imagen'); }
    finally { setBusy(false); }
  };

  const handleSendImageWhatsApp = async () => {
    setBusy(true);
    try {
      const blob = await generateBlob();
      if (!blob) throw new Error('No se pudo generar la imagen');
      const file = new File([blob], `Recibo-${item.id}.png`, { type: 'image/png' });
      const nav = navigator as any;
      const phone = item.phone || item.altPhone;
      const text = `📋 Recibo de Servicio - ${bName}\nOrden #${item.id}\nEstado: ${item.status}\nTotal: $${remaining.toLocaleString()}`;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `Recibo #${item.id}`, text });
        return;
      }
      // Fallback: download then open WhatsApp text with note to attach
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Recibo-${item.id}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.info('Imagen descargada. Adjuntala en WhatsApp.');
      if (phone) openWhatsApp(phone, text);
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error(e?.message || 'Error al enviar imagen');
    }
    finally { setBusy(false); }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Recibo #${item.id}</title>
      <style>
        body { font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 10px; font-size: 12px; }
        h1 { text-align: center; font-size: 14px; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .label { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        .total { font-size: 14px; font-weight: bold; }
        .footer { text-align: center; margin-top: 12px; font-size: 10px; color: #666; }
        .humidity { background: #fff3cd; padding: 4px; margin: 6px 0; border: 1px solid #ffc107; font-size: 11px; }
      </style></head><body>
      <h1>🔧 ${bName}</h1>
      ${bAddress ? `<div style="text-align:center;font-size:10px;margin-bottom:4px">${bAddress}</div>` : ''}
      ${bHours ? `<div style="text-align:center;font-size:10px;margin-bottom:8px">🕐 ${bHours}</div>` : ''}
      <div class="divider"></div>
      <div class="row"><span class="label">Orden:</span><span>#${item.id}</span></div>
      <div class="row"><span class="label">Fecha:</span><span>${item.dateIn}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Cliente:</span><span>${item.clientName}</span></div>
      ${item.phone ? `<div class="row"><span class="label">Tel:</span><span>${item.phone}</span></div>` : ''}
      <div class="row"><span class="label">Equipo:</span><span>${item.brand} ${item.model}</span></div>
      <div class="divider"></div>
      <div class="row"><span class="label">Problema:</span></div>
      <div style="padding: 2px 0;">${item.problem}</div>
      ${item.hasHumidity ? '<div class="humidity">⚠️ Equipo con evidencia de humedad/sulfato</div>' : ''}
      <div class="divider"></div>
      <div class="row"><span class="label">Presupuesto:</span><span>$${(item.budget || 0).toLocaleString()}</span></div>
      <div class="row"><span class="label">Seña:</span><span>$${(item.deposit || 0).toLocaleString()}</span></div>
      <div class="row total"><span>Saldo:</span><span>$${remaining.toLocaleString()}</span></div>
      ${item.dateEstimated ? `<div class="divider"></div><div class="row"><span class="label">Entrega est.:</span><span>${item.dateEstimated}</span></div>` : ''}
      <div class="row"><span class="label">Estado:</span><span>${item.status}</span></div>
      <div class="row"><span class="label">Garantía:</span><span>${warrantyLabel}</span></div>
      <div class="footer">Gracias por confiar en ${bName}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleShareWhatsApp = () => {
    let msg = `📋 *Recibo de Servicio - ${bName}*\n`;
    msg += `Orden: #${item.id}\nFecha: ${item.dateIn}\n`;
    msg += `Cliente: ${item.clientName}\n`;
    msg += `Equipo: ${item.brand} ${item.model}\n`;
    msg += `Problema: ${item.problem}\n`;
    if (item.hasHumidity) msg += `⚠️ Equipo con evidencia de humedad/sulfato\n`;
    msg += `\nPresupuesto: $${(item.budget || 0).toLocaleString()}\n`;
    msg += `Seña: $${(item.deposit || 0).toLocaleString()}\n`;
    msg += `*Saldo: $${remaining.toLocaleString()}*\n`;
    msg += `Estado: ${item.status}\nGarantía: ${warrantyLabel}\n`;
    if (bAddress) msg += `\n📍 ${bAddress}`;
    if (bHours) msg += `\n🕐 ${bHours}`;
    const phone = item.phone || item.altPhone;
    if (phone) openWhatsApp(phone, msg);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo - Orden #{item.id}</DialogTitle>
        </DialogHeader>
        <div ref={receiptRef} className="space-y-4 font-mono text-sm border rounded-lg p-5 bg-white text-black">
          <div className="text-center border-b border-dashed border-gray-400 pb-3">
            {logoUrl ? (
              <img src={logoUrl} alt={bName} crossOrigin="anonymous" className="h-14 w-14 rounded-full object-cover mx-auto mb-2 border" />
            ) : null}
            <p className="text-lg font-bold">{bName}</p>
            {bAddress && <p className="text-[10px] text-muted-foreground">{bAddress}</p>}
            {bHours && <p className="text-[10px] text-muted-foreground">🕐 {bHours}</p>}
            <p className="text-xs text-muted-foreground mt-1">Orden #{item.id} · {item.dateIn}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-semibold">{item.clientName}</span></div>
            {item.phone && <div className="flex justify-between"><span className="text-muted-foreground">Tel:</span><span>{item.phone}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Equipo:</span><span>{item.brand} {item.model}</span></div>
          </div>

          <div className="border-t border-dashed pt-3">
            <p className="text-muted-foreground text-xs mb-1">Problema:</p>
            <p>{item.problem}</p>
          </div>

          {item.hasHumidity && (
            <div className="bg-status-waiting/10 border border-status-waiting/30 rounded-lg p-2 text-xs font-semibold text-status-waiting">
              ⚠️ Equipo con evidencia de humedad/sulfato
            </div>
          )}

          <div className="border-t border-dashed pt-3 space-y-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Presupuesto:</span><span>${(item.budget || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Seña:</span><span>${(item.deposit || 0).toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Saldo:</span><span>${remaining.toLocaleString()}</span></div>
          </div>

          {item.dateEstimated && (
            <div className="flex justify-between border-t border-dashed pt-3">
              <span className="text-muted-foreground">Entrega est.:</span><span>{item.dateEstimated}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Garantía:</span><span>{warrantyLabel}</span>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Gracias por confiar en {bName}
          </div>
          {item.status === 'Entregado' && (
            <div className="text-center text-xs font-bold text-green-700 border-2 border-green-600 rounded-md py-1">
              ✓ EQUIPO ENTREGADO
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button variant="outline" className="gap-2" onClick={handleDownloadImage} disabled={busy}>
            <Download className="h-4 w-4" />
            Descargar Imagen
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleShareWhatsApp}>
            <Share2 className="h-4 w-4" />
            WhatsApp Texto
          </Button>
          <Button className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white" onClick={handleSendImageWhatsApp} disabled={busy}>
            <ImageIcon className="h-4 w-4" />
            Enviar Recibo por WhatsApp
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
