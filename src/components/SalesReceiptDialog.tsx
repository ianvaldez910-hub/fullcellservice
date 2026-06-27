import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { ReceiptSettings } from '@/hooks/useReceiptSettings';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export type SaleReceiptData = {
  id: string;
  created_at: string;
  buyer_name: string;
  payment_method: string;
  items: Array<{ name: string; category?: string; qty: number; price: number; subtotal: number }>;
  total: number;
};

const money = (n: number) => `$${(Number(n) || 0).toLocaleString('es-AR')}`;

interface Props {
  open: boolean;
  onClose: () => void;
  sale: SaleReceiptData | null;
  settings: ReceiptSettings;
  businessName: string;
}

export function SalesReceiptDialog({ open, onClose, sale, settings, businessName }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  if (!sale) return null;

  const date = new Date(sale.created_at);
  const dateStr = date.toLocaleString('es-AR');
  const shortId = sale.id.slice(0, 8).toUpperCase();

  const downloadImage = async () => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, { backgroundColor: settings.bg_color, scale: 2, useCORS: true, logging: false });
      const blob: Blob | null = await new Promise(r => canvas.toBlob(b => r(b), 'image/png', 0.95));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `NotaVenta-${shortId}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) { toast.error(e?.message || 'Error al generar imagen'); }
  };

  const handlePrint = () => {
    if (!ref.current) return;
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-receipt'), 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 print-hidden">
          <DialogTitle>Nota de Venta · #{shortId}</DialogTitle>
        </DialogHeader>

        <div
          ref={ref}
          id="sales-receipt-print-area"
          className="receipt-print mx-auto px-5 py-5"
          style={{
            background: settings.bg_color,
            color: settings.text_color,
            fontFamily: settings.font_family,
            width: '100%',
            maxWidth: 380,
          }}
        >
          <div className="text-center" style={{ borderBottom: `2px dashed ${settings.accent_color}`, paddingBottom: 10, marginBottom: 12 }}>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={businessName} crossOrigin="anonymous" style={{ height: 56, width: 56, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 6px', border: `2px solid ${settings.accent_color}` }} />
            ) : null}
            <div style={{ fontSize: 16, fontWeight: 700, color: settings.accent_color }}>{businessName}</div>
            {settings.header_text ? (
              <div style={{ fontSize: 10, whiteSpace: 'pre-line', marginTop: 2, opacity: 0.85 }}>{settings.header_text}</div>
            ) : null}
          </div>

          <div style={{ fontSize: 11, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
            <span>Nota #{shortId}</span>
            <span>{dateStr}</span>
          </div>
          <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Cliente:</strong> {sale.buyer_name}</div>
          <div style={{ fontSize: 12, marginBottom: 10 }}><strong>Pago:</strong> {sale.payment_method}</div>

          <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${settings.accent_color}` }}>
                <th style={{ textAlign: 'left', padding: '4px 2px' }}>Detalle</th>
                <th style={{ textAlign: 'center', padding: '4px 2px' }}>Cant.</th>
                <th style={{ textAlign: 'right', padding: '4px 2px' }}>P.U.</th>
                <th style={{ textAlign: 'right', padding: '4px 2px' }}>Sub.</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px dashed rgba(0,0,0,0.15)' }}>
                  <td style={{ padding: '4px 2px' }}>
                    {it.category ? <div style={{ fontSize: 9, opacity: 0.7 }}>{it.category}</div> : null}
                    <div>{it.name}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '4px 2px' }}>{it.qty}</td>
                  <td style={{ textAlign: 'right', padding: '4px 2px' }}>{money(it.price)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 2px' }}>{money(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 6, background: settings.accent_color, color: '#fff', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
            <span>TOTAL</span>
            <span>{money(sale.total)}</span>
          </div>

          {settings.footer_text ? (
            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 12, whiteSpace: 'pre-line', opacity: 0.85 }}>{settings.footer_text}</div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 justify-end p-4 border-t print-hidden">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
          <Button variant="outline" className="gap-2" onClick={downloadImage}>
            <Download className="h-4 w-4" /> Imagen
          </Button>
          <Button className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}